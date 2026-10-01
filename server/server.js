import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';

const db = new DatabaseSync('ecomarket.db');
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

// Pembungkus transaksi sederhana (node:sqlite tidak punya db.transaction)
const tx = (fn) => { db.exec('BEGIN'); try { fn(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } };

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, icon TEXT);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT,
  price INTEGER NOT NULL, category_id INTEGER NOT NULL REFERENCES categories(id),
  material TEXT NOT NULL, location TEXT NOT NULL, impact_score INTEGER NOT NULL,
  co2_saved_kg REAL NOT NULL, waste_saved_kg REAL NOT NULL, certification TEXT,
  emoji TEXT, stock INTEGER DEFAULT 50);
CREATE TABLE IF NOT EXISTS cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL UNIQUE REFERENCES products(id), qty INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS impact_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_ref TEXT NOT NULL, product_name TEXT NOT NULL,
  qty INTEGER NOT NULL, waste_kg REAL NOT NULL, co2_kg REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')));
`);

// ---------- Auth (dummy) ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  password_hash TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), created_at TEXT DEFAULT (datetime('now')));
`);
const hashPw = (pw, salt = crypto.randomBytes(16).toString('hex')) => `${salt}:${crypto.scryptSync(pw, salt, 32).toString('hex')}`;
const checkPw = (pw, stored) => {
  const [salt, h] = stored.split(':');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), crypto.scryptSync(pw, salt, 32));
};
// Akun demo: admin / admin123
if (!db.prepare('SELECT 1 FROM users WHERE username = ?').get('admin'))
  db.prepare('INSERT INTO users (username, name, password_hash) VALUES (?,?,?)').run('admin', 'Admin', hashPw('admin123'));

// ---------- Seed ----------
if (db.prepare('SELECT COUNT(*) c FROM categories').get().c === 0) {
  const cats = [['Dapur', '🍳'], ['Kebersihan', '🧼'], ['Fashion', '👕'], ['Rumah Tangga', '🏡'], ['Kantor', '📓']];
  const insCat = db.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)');
  cats.forEach((c) => insCat.run(...c));

  // name, desc, price, cat, material, location, score, co2, waste, cert, emoji
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

// ---------- API ----------
const app = express();
app.use(cors());
app.use(express.json());

const wrap = (fn) => (req, res) => {
  try { fn(req, res); } catch (e) { console.error(e); res.status(500).json({ error: 'Terjadi kesalahan pada server.' }); }
};

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

app.get('/api/stats', wrap((_, res) => {
  const s = db.prepare('SELECT COUNT(*) products, ROUND(SUM(waste_saved_kg),1) potential_waste FROM products').get();
  const mine = db.prepare('SELECT COALESCE(ROUND(SUM(waste_kg),1),0) waste, COALESCE(ROUND(SUM(co2_kg),1),0) co2 FROM impact_history').get();
  res.json({ products: s.products, waste_reduced: mine.waste, co2_reduced: mine.co2 });
}));

// Auth
const publicUser = (u) => ({ id: u.id, username: u.username, name: u.name });
const bearer = (req) => (req.headers.authorization || '').replace('Bearer ', '');
const startSession = (u) => {
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, u.id);
  return { token, user: publicUser(u) };
};

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
  const u = db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').get(bearer(req));
  u ? res.json(publicUser(u)) : res.status(401).json({ error: 'Belum masuk.' });
}));

app.post('/api/auth/logout', wrap((req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(bearer(req));
  res.json({ ok: true });
}));

// Keranjang
const CART_SQL = `SELECT ct.id, ct.qty, p.id AS product_id, p.name, p.price, p.emoji, p.impact_score,
  p.waste_saved_kg, p.co2_saved_kg FROM cart ct JOIN products p ON p.id = ct.product_id ORDER BY ct.id`;

app.get('/api/cart', wrap((_, res) => res.json(db.prepare(CART_SQL).all())));

app.post('/api/cart', wrap((req, res) => {
  const { product_id, qty = 1 } = req.body;
  if (!db.prepare('SELECT 1 FROM products WHERE id = ?').get(product_id))
    return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  db.prepare(`INSERT INTO cart (product_id, qty) VALUES (?, ?)
    ON CONFLICT(product_id) DO UPDATE SET qty = qty + excluded.qty`).run(product_id, qty);
  res.status(201).json(db.prepare(CART_SQL).all());
}));

app.patch('/api/cart/:id', wrap((req, res) => {
  const qty = Number(req.body.qty);
  if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ error: 'Jumlah minimal 1.' });
  db.prepare('UPDATE cart SET qty = ? WHERE id = ?').run(qty, req.params.id);
  res.json(db.prepare(CART_SQL).all());
}));

app.delete('/api/cart/:id', wrap((req, res) => {
  db.prepare('DELETE FROM cart WHERE id = ?').run(req.params.id);
  res.json(db.prepare(CART_SQL).all());
}));

// Simulasi checkout
app.post('/api/checkout', wrap((req, res) => {
  const items = db.prepare(CART_SQL).all();
  if (!items.length) return res.status(400).json({ error: 'Keranjang masih kosong.' });
  const ref = 'ECO-' + Date.now().toString(36).toUpperCase();
  const ins = db.prepare('INSERT INTO impact_history (order_ref, product_name, qty, waste_kg, co2_kg) VALUES (?,?,?,?,?)');
  tx(() => {
    items.forEach((i) => ins.run(ref, i.name, i.qty, i.waste_saved_kg * i.qty, i.co2_saved_kg * i.qty));
    db.prepare('DELETE FROM cart').run();
  });
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  res.status(201).json({ order_ref: ref, total, items: items.length });
}));

// Dampak Saya
app.get('/api/impact', wrap((_, res) => {
  const totals = db.prepare(`SELECT COALESCE(ROUND(SUM(waste_kg),1),0) waste, COALESCE(ROUND(SUM(co2_kg),1),0) co2,
    COUNT(DISTINCT order_ref) orders, COALESCE(SUM(qty),0) items FROM impact_history`).get();
  const history = db.prepare('SELECT * FROM impact_history ORDER BY id DESC LIMIT 50').all();
  res.json({ totals, history });
}));

app.listen(4000, () => console.log('EcoMarket API: http://localhost:4000'));
