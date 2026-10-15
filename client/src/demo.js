import { useEffect, useState } from 'react';

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/** State yang tersimpan di localStorage (dummy, hanya di browser ini) */
export function useStored(key, initial) {
  const [v, setV] = useState(() => read(key, initial));
  useEffect(() => write(key, v), [key, v]);
  return [v, setV];
}

/** Dompet EcoPay (dummy) per pengguna */
export function useWallet(username) {
  return useStored(`ecopay:${username}`, { balance: 500000, tx: [{ id: 1, label: 'Saldo awal (demo)', amount: 500000, date: new Date().toISOString() }] });
}

export const SEED_NOTIFS = [
  { id: 1, type: 'promo', title: 'Diskon 15% produk bambu', body: 'Khusus minggu ini untuk member EcoMarket.', time: new Date(Date.now() - 36e5).toISOString(), read: false },
  { id: 2, type: 'impact', title: 'Target mingguan hampir tercapai', body: 'Tinggal 0,6 kg lagi untuk lencana berikutnya.', time: new Date(Date.now() - 864e5).toISOString(), read: false },
  { id: 3, type: 'tips', title: 'Tips hijau', body: 'Bawa tumbler sendiri bisa menghemat ±150 botol plastik per tahun.', time: new Date(Date.now() - 3 * 864e5).toISOString(), read: true },
];
export const DEFAULT_NSET = { push: false, promo: true, order: true, impact: true, tips: false };

export const ago = (iso) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 6e4));
  return m < 1 ? 'baru saja' : m < 60 ? `${m} mnt lalu` : m < 1440 ? `${Math.round(m / 60)} jam lalu` : `${Math.round(m / 1440)} hari lalu`;
};

// ---- Data dummy panel admin ----
export const KPI = [['Pendapatan bulan ini', 'Rp 18,4 jt', '+12%'], ['Pesanan', '126', '+8%'], ['Pengguna aktif', '842', '+21%'], ['Limbah terhindar', '312 kg', '+17%']];
export const SALES = [8, 9, 7, 11, 12, 10, 13, 15, 14, 17, 19, 18];
export const FORECAST = [20, 21.5, 23, 24.5];
export const CATS = [['Dapur', 38], ['Kebersihan', 27], ['Fashion', 16], ['Rumah Tangga', 11], ['Kantor', 8]];
export const ORDERS = [
  ['ECO-A1F3', 'Rina Putri', 185000, 'QRIS', 'Selesai'], ['ECO-B72K', 'Dimas Aji', 78000, 'E-wallet', 'Dikirim'],
  ['ECO-C09P', 'Salsa Nur', 242000, 'Transfer bank', 'Diproses'], ['ECO-D44Z', 'Budi Santoso', 65000, 'EcoPay', 'Diproses'],
  ['ECO-E18M', 'Ayu Lestari', 149000, 'Bayar di tempat', 'Dikirim'], ['ECO-F63Q', 'Fajar Nugroho', 120000, 'QRIS', 'Selesai'],
];
export const USERS = [
  ['Rina Putri', 'rina_p', '12 Agu 2026', 9], ['Dimas Aji', 'dimasaji', '30 Agu 2026', 5], ['Salsa Nur', 'salsanur', '02 Sep 2026', 7],
  ['Budi Santoso', 'budi_s', '15 Sep 2026', 2], ['Ayu Lestari', 'ayul', '21 Sep 2026', 4], ['Fajar Nugroho', 'fajarn', '28 Sep 2026', 1],
];
export const VERIF = [
  ['Toko Bambu Lestari', 'Sedotan Bambu Set 12', 'FSC-C123456'], ['Kriya Sabut Nusantara', 'Keset Sabut Kelapa', 'Kompos-SNI'],
  ['Katun Alam', 'Tote Bag Katun Organik', 'GOTS-88213'], ['Ecoprint Studio', 'Syal Pewarna Alami', 'Belum diunggah'],
];
export const AI_REPLIES = [
  [/stok|restock|persediaan/i, 'Prediksi permintaan 2 minggu ke depan menunjukkan Sikat Gigi Bambu dan Sedotan Bambu berisiko habis. Saran restock: +120 dan +80 unit.'],
  [/jual|omzet|pendapatan|penjualan/i, 'Penjualan diperkirakan naik 9–14% dalam 4 minggu ke depan, didorong kategori Dapur dan Kebersihan. Tingkat keyakinan model: 86%.'],
  [/pengguna|user|segmen|pelanggan/i, 'Ada 3 segmen utama: Pemula Hijau (38%), Kolektor Skor Tinggi (34%), dan Pemburu Promo (28%). Segmen pertama paling responsif terhadap penjelasan skor.'],
  [/limbah|dampak|co2|karbon/i, 'Total limbah terhindar 312 kg bulan ini. Jika produk skor ≥ 90 dipromosikan di Beranda, perkiraan tambahan 41 kg per bulan.'],
];
export const AI_FALLBACK = 'Ini jawaban simulasi. Coba tanya tentang stok, penjualan, pengguna, atau dampak lingkungan.';
