import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';

const db = new DatabaseSync('ecomarket.db');
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
const tx = (fn) => { db.exec('BEGIN'); try { fn(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } };

// ---------- Skema ----------
const CART_DDL = `CREATE TABLE IF NOT EXISTS cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id), qty INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, product_id))`;

db.exec(`
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, icon TEXT);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT,
  price INTEGER NOT NULL, category_id INTEGER NOT NULL REFERENCES categories(id),
  material TEXT NOT NULL, location TEXT NOT NULL, impact_score INTEGER NOT NULL,
  co2_saved_kg REAL NOT NULL, waste_saved_kg REAL NOT NULL, certification TEXT,
  emoji TEXT, stock INTEGER DEFAULT 50);
${CART_DDL};
CREATE TABLE IF NOT EXISTS impact_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, order_ref TEXT NOT NULL, product_name TEXT NOT NULL,
  qty INTEGER NOT NULL, waste_kg REAL NOT NULL, co2_kg REAL NOT NULL, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  password_hash TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL REFERENCES users(id), product_id INTEGER NOT NULL REFERENCES products(id),
  PRIMARY KEY (user_id, product_id));
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, order_ref TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, payment_method TEXT NOT NULL,
  total INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')));
`);

// Migrasi dari versi lama (keranjang & dampak belum per-pengguna)
const hasCol = (t, c) => db.prepare(`PRAGMA table_info(${t})`).all().some((r) => r.name === c);
if (!hasCol('cart', 'user_id')) { db.exec('DROP TABLE cart'); db.exec(CART_DDL); }
if (!hasCol('impact_history', 'user_id')) {
  db.exec('ALTER TABLE impact_history ADD COLUMN user_id INTEGER');
  db.exec('UPDATE impact_history SET user_id = 1 WHERE user_id IS NULL');
}

// ---------- Auth helpers ----------
const hashPw = (pw, salt = crypto.randomBytes(16).toString('hex')) => `${salt}:${crypto.scryptSync(pw, salt, 32).toString('hex')}`;
const checkPw = (pw, stored) => {
  const [salt, h] = stored.split(':');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), crypto.scryptSync(pw, salt, 32));
};

// ---------- Seed ----------
if (db.prepare('SELECT COUNT(*) c FROM categories').get().c === 0) {
  const cats = [['Dapur', '🍳'], ['Kebersihan', '🧼'], ['Fashion', '👕'], ['Rumah Tangga', '🏡'], ['Kantor', '📓']];
  const insCat = db.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)');
  cats.forEach((c) => insCat.run(...c));
  const items = [
    ['Sedotan Bambu Set 6', 'Sedotan bambu dengan sikat pembersih dan pouch kain.', 35000, 1, 'Bambu', 'Yogyakarta', 92, 0.8, 0.5, 'FSC', '🎋'],
    ['Tumbler Stainless 500ml', 'Tahan panas dan dingin 12 jam, bebas BPA.', 120000, 1, 'Stainless Steel', 'Bandung', 85, 2.4, 1.2, 'Food Grade 304', '🥤'],
    ['Beeswax Wrap 3 Ukuran', 'Pengganti plastik wrap, bisa dipakai ulang hingga 1 tahun.', 78000, 1, 'Katun Organik', 'Bali', 88, 1.1, 0.9, 'GOTS', '🐝'],
    ['Sabun Batang Zero Waste', 'Sabun cuci piring padat berbahan minyak kelapa.', 28000, 2, 'Minyak Kelapa', 'Bogor', 90, 0.6, 0.4, 'Vegan', '🧼'],
    ['Sikat Gigi Bambu 4 Pcs', 'Gagang bambu, bulu sikat nabati lembut.', 42000, 2, 'Bambu', 'Yogyakarta', 91, 0.9, 0.3, 'FSC', '🪥'],
    ['Spons Sabut Alami', 'Spons dari sabut kelapa yang bisa terurai.', 18000, 2, 'Sabut Kelapa', 'Semarang', 94, 0.4, 0.3, 'Kompos', '🥥'],
    ['Tote Bag Kanvas Daur Ulang', 'Dibuat dari limbah kanvas, kuat hingga 15 kg.', 65000, 3, 'Kanvas Daur Ulang', 'Bandung', 80, 1.9, 1.4, 'GRS', '👜'],
    ['Kaos Katun Organik', 'Katun organik bersertifikat, pewarna alami.', 149000, 3, 'Katun Organik', 'Bali', 78, 3.2, 1.0, 'GOTS', '👕'],
    ['Lampu LED Hemat Energi', 'Hemat daya 80% dibanding lampu pijar.', 45000, 4, 'Aluminium Daur Ulang', 'Jakarta', 74, 5.0, 0.2, 'SNI', '💡'],
    ['Pot Tanaman Serat Kelapa', 'Pot dapat terurai langsung ditanam ke tanah.', 32000, 4, 'Sabut Kelapa', 'Semarang', 89, 0.7, 0.6, 'Kompos', '🪴'],
    ['Buku Catatan Kertas Daur Ulang', '100 halaman, sampul kardus bekas.', 25000, 5, 'Kertas Daur Ulang', 'Jakarta', 86, 0.9, 0.7, 'FSC Recycled', '📓'],
    ['Pulpen Isi Ulang Bambu', 'Badan bambu, tinta isi ulang tersedia.', 22000, 5, 'Bambu', 'Yogyakarta', 83, 0.3, 0.1, 'FSC', '🖊️'],
  ];
  const insP = db.prepare(`INSERT INTO products
    (name, description, price, category_id, material, location, impact_score, co2_saved_kg, waste_saved_kg, certification, emoji)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  tx(() => items.forEach((i) => insP.run(...i)));
}

// Akun demo: admin / admin123
if (!db.prepare('SELECT 1 FROM users WHERE username = ?').get('admin'))
  db.prepare('INSERT INTO users (username, name, password_hash) VALUES (?,?,?)').run('admin', 'Admin', hashPw('admin123'));

// Data demo untuk akun admin (hanya jika masih kosong) agar halaman Dampak Saya langsung terisi
const adminId = db.prepare('SELECT id FROM users WHERE username = ?').get('admin').id;
if (db.prepare('SELECT COUNT(*) c FROM impact_history WHERE user_id = ?').get(adminId).c === 0) {
  const demo = [[6, [[1, 2], [4, 1]]], [4, [[2, 1], [6, 3]]], [2, [[10, 1], [11, 2], [5, 1]]]];
  const getP = db.prepare('SELECT * FROM products WHERE id = ?');
  const insO = db.prepare(`INSERT INTO orders (user_id, order_ref, name, phone, address, payment_method, total, created_at)
    VALUES (?,?,?,?,?,?,?, datetime('now', ?))`);
  const insH = db.prepare(`INSERT INTO impact_history (user_id, order_ref, product_name, qty, waste_kg, co2_kg, created_at)
    VALUES (?,?,?,?,?,?, datetime('now', ?))`);
  tx(() => demo.forEach(([ago, lines], n) => {
    const ref = `ECO-DEMO0${n + 1}`; const when = `-${ago} day`; let total = 0;
    lines.forEach(([pid, qty]) => {
      const p = getP.get(pid); total += p.price * qty;
      insH.run(adminId, ref, p.name, qty, +(p.waste_saved_kg * qty).toFixed(2), +(p.co2_saved_kg * qty).toFixed(2), when);
    });
    insO.run(adminId, ref, 'Admin', '081234567890', 'Jl. Contoh No. 1, Surakarta', 'transfer', total, when);
  }));
}

// ---------- API ----------
const app = express();
app.use(cors());
app.use(express.json());

const wrap = (fn) => (req, res) => {
  try { fn(req, res); } catch (e) { console.error(e); res.status(500).json({ error: 'Terjadi kesalahan pada server.' }); }
};
const bearer = (req) => (req.headers.authorization || '').replace('Bearer ', '');
const userByToken = (t) => db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').get(t);
const publicUser = (u) => ({ id: u.id, username: u.username, name: u.name });
const startSession = (u) => {
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, u.id);
  return { token, user: publicUser(u) };
};

// Katalog (publik)
const PRODUCT_SQL = `SELECT p.*, c.name AS category FROM products p JOIN categories c ON c.id = p.category_id`;
app.get('/api/categories', wrap((_, res) => res.json(db.prepare('SELECT * FROM categories').all())));
app.get('/api/filters', wrap((_, res) => res.json({
  materials: db.prepare('SELECT DISTINCT material FROM products ORDER BY material').all().map((r) => r.material),
  locations: db.prepare('SELECT DISTINCT location FROM products ORDER BY location').all().map((r) => r.location),
})));
app.get('/api/products', wrap((req, res) => {
  const { material, location, category, q, sort } = req.query;
  const where = []; const args = [];
  if (material) { where.push('p.material = ?'); args.push(material); }
  if (location) { where.push('p.location = ?'); args.push(location); }
  if (category) { where.push('p.category_id = ?'); args.push(category); }
  if (q) { where.push('p.name LIKE ?'); args.push(`%${q}%`); }
  const order = { price: 'p.price ASC', score: 'p.impact_score DESC' }[sort] || 'p.impact_score DESC';
  res.json(db.prepare(`${PRODUCT_SQL} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`).all(...args));
}));
app.get('/api/products/:id', wrap((req, res) => {
  const p = db.prepare(`${PRODUCT_SQL} WHERE p.id = ?`).get(req.params.id);
  p ? res.json(p) : res.status(404).json({ error: 'Produk tidak ditemukan.' });
}));

// Auth
app.post('/api/auth/signup', wrap((req, res) => {
  const { name = '', username = '', password = '' } = req.body;
  const uname = username.trim().toLowerCase();
  if (!name.trim()) return res.status(400).json({ error: 'Nama wajib diisi.' });
  if (!/^[a-z0-9_]{3,20}$/.test(uname)) return res.status(400).json({ error: 'Username 3–20 karakter: huruf kecil, angka, atau garis bawah.' });
  if (password.length < 6) return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(uname)) return res.status(409).json({ error: 'Username sudah dipakai.' });
  const info = db.prepare('INSERT INTO users (username, name, password_hash) VALUES (?,?,?)').run(uname, name.trim(), hashPw(password));
  res.status(201).json(startSession(db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)));
}));
app.post('/api/auth/login', wrap((req, res) => {
  const { username = '', password = '' } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (!u || !checkPw(password, u.password_hash)) return res.status(401).json({ error: 'Username atau kata sandi salah.' });
  res.json(startSession(u));
}));
app.get('/api/auth/me', wrap((req, res) => {
  const u = userByToken(bearer(req));
  u ? res.json(publicUser(u)) : res.status(401).json({ error: 'Belum masuk.' });
}));
app.post('/api/auth/logout', wrap((req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(bearer(req));
  res.json({ ok: true });
}));

// Semua data di bawah ini milik pengguna yang login
app.use(['/api/cart', '/api/checkout', '/api/impact', '/api/stats', '/api/favorites'], (req, res, next) => {
  const u = userByToken(bearer(req));
  if (!u) return res.status(401).json({ error: 'Silakan masuk terlebih dahulu.' });
  req.user = u; next();
});

// Favorit
const favIds = (uid) => db.prepare('SELECT product_id FROM favorites WHERE user_id = ? ORDER BY rowid').all(uid).map((r) => r.product_id);
app.get('/api/favorites', wrap((req, res) => res.json(favIds(req.user.id))));
app.put('/api/favorites/:id', wrap((req, res) => {
  if (!db.prepare('SELECT 1 FROM products WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  res.json(favIds(req.user.id));
}));
app.delete('/api/favorites/:id', wrap((req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.id);
  res.json(favIds(req.user.id));
}));

// Statistik beranda
app.get('/api/stats', wrap((req, res) => {
  const n = db.prepare('SELECT COUNT(*) c FROM products').get().c;
  const mine = db.prepare('SELECT COALESCE(ROUND(SUM(waste_kg),1),0) waste, COALESCE(ROUND(SUM(co2_kg),1),0) co2 FROM impact_history WHERE user_id = ?').get(req.user.id);
  res.json({ products: n, waste_reduced: mine.waste, co2_reduced: mine.co2 });
}));

// Keranjang
const CART_SQL = `SELECT ct.id, ct.qty, p.id AS product_id, p.name, p.price, p.emoji, p.impact_score,
  p.waste_saved_kg, p.co2_saved_kg FROM cart ct JOIN products p ON p.id = ct.product_id WHERE ct.user_id = ? ORDER BY ct.id`;
const cartOf = (uid) => db.prepare(CART_SQL).all(uid);

app.get('/api/cart', wrap((req, res) => res.json(cartOf(req.user.id))));
app.post('/api/cart', wrap((req, res) => {
  const { product_id, qty = 1 } = req.body;
  if (!db.prepare('SELECT 1 FROM products WHERE id = ?').get(product_id)) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  db.prepare(`INSERT INTO cart (user_id, product_id, qty) VALUES (?, ?, ?)
    ON CONFLICT(user_id, product_id) DO UPDATE SET qty = MIN(99, qty + excluded.qty)`).run(req.user.id, product_id, qty);
  res.status(201).json(cartOf(req.user.id));
}));
app.patch('/api/cart/:id', wrap((req, res) => {
  const qty = Number(req.body.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) return res.status(400).json({ error: 'Jumlah harus 1–99.' });
  db.prepare('UPDATE cart SET qty = ? WHERE id = ? AND user_id = ?').run(qty, req.params.id, req.user.id);
  res.json(cartOf(req.user.id));
}));
app.delete('/api/cart/:id', wrap((req, res) => {
  db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json(cartOf(req.user.id));
}));

// Checkout (simulasi, tanpa pembayaran nyata)
app.post('/api/checkout', wrap((req, res) => {
  const { name = '', phone = '', address = '', payment_method = '' } = req.body;
  const fields = {};
  if (name.trim().length < 3) fields.name = 'Nama minimal 3 karakter.';
  if (!/^(\+62|62|0)8\d{8,11}$/.test(phone.replace(/[\s-]/g, ''))) fields.phone = 'Nomor HP tidak valid. Contoh: 081234567890.';
  if (address.trim().length < 10) fields.address = 'Alamat minimal 10 karakter, termasuk jalan dan kota.';
  if (!['transfer', 'ewallet', 'cod'].includes(payment_method)) fields.method = 'Pilih metode pembayaran.';
  if (Object.keys(fields).length) return res.status(400).json({ error: 'Periksa kembali data pengiriman.', fields });

  const items = cartOf(req.user.id);
  if (!items.length) return res.status(400).json({ error: 'Keranjang masih kosong.' });
  const ref = 'ECO-' + Date.now().toString(36).toUpperCase();
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const ins = db.prepare('INSERT INTO impact_history (user_id, order_ref, product_name, qty, waste_kg, co2_kg) VALUES (?,?,?,?,?,?)');
  tx(() => {
    items.forEach((i) => ins.run(req.user.id, ref, i.name, i.qty, +(i.waste_saved_kg * i.qty).toFixed(2), +(i.co2_saved_kg * i.qty).toFixed(2)));
    db.prepare('INSERT INTO orders (user_id, order_ref, name, phone, address, payment_method, total) VALUES (?,?,?,?,?,?,?)')
      .run(req.user.id, ref, name.trim(), phone.trim(), address.trim(), payment_method, total);
    db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);
  });
  res.status(201).json({ order_ref: ref, total, items: items.length });
}));

// Dampak Saya
app.get('/api/impact', wrap((req, res) => {
  const uid = req.user.id;
  const totals = db.prepare(`SELECT COALESCE(ROUND(SUM(waste_kg),1),0) waste, COALESCE(ROUND(SUM(co2_kg),1),0) co2,
    COUNT(DISTINCT order_ref) orders, COALESCE(SUM(qty),0) items FROM impact_history WHERE user_id = ?`).get(uid);
  const lines = db.prepare('SELECT product_name, qty, waste_kg, co2_kg FROM impact_history WHERE user_id = ? AND order_ref = ?');
  const orders = db.prepare('SELECT order_ref, total, payment_method, created_at FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 20')
    .all(uid).map((o) => ({ ...o, items: lines.all(uid, o.order_ref) }));
  const rows = db.prepare(`SELECT date(created_at) d, SUM(waste_kg) w, SUM(co2_kg) c FROM impact_history
    WHERE user_id = ? AND date(created_at) >= date('now','-6 day') GROUP BY d`).all(uid);
  const byDay = Object.fromEntries(rows.map((r) => [r.d, r]));
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10);
    return { date: d, waste: +(byDay[d]?.w || 0).toFixed(2), co2: +(byDay[d]?.c || 0).toFixed(2) };
  });
  res.json({ totals, orders, weekly });
}));

app.listen(4000, () => console.log('EcoMarket API: http://localhost:4000'));
