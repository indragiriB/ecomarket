import { useEffect, useState } from 'react';
import { useFetch, rupiah } from '../api';
import { DemoTag, EmptyState, Spinner, ErrorState } from '../components/ui';
import Confirm from '../components/Confirm';
import Icon from '../components/Icon';
import { KPI, SALES, FORECAST, CATS, ORDERS, USERS, VERIF, AI_REPLIES, AI_FALLBACK } from '../demo';

const TABS = [['ringkasan', 'Ringkasan'], ['produk', 'Produk'], ['pesanan', 'Pesanan'], ['pengguna', 'Pengguna'], ['verifikasi', 'Verifikasi'], ['ai', 'Analitik AI']];
const TONE = { Selesai: 'bg-primary text-on-primary', Dikirim: 'bg-tertiary-container text-tertiary', Diproses: 'bg-surface-variant text-on-surface', Aktif: 'bg-primary text-on-primary', Diblokir: 'bg-error-container text-error', Draf: 'bg-surface-variant text-on-surface', Disetujui: 'bg-primary text-on-primary', Ditolak: 'bg-error-container text-error', Menunggu: 'bg-surface-variant text-on-surface' };
const Badge = ({ s }) => <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TONE[s]}`}>{s}</span>;
const Table = ({ head, children }) => (
  <div className="card overflow-x-auto px-3 py-1">
    <table className="w-full min-w-[640px] text-sm">
      <thead><tr className="text-left text-on-surface-variant">{head.map((h) => <th key={h} className="py-3 pr-4 font-medium">{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);
const td = 'border-t border-on-surface/10 py-3 pr-4';
const act = 'flex h-11 w-11 items-center justify-center rounded-full hover:bg-on-surface/10';

function LineChart() {
  const n = SALES.length, all = [...SALES, ...FORECAST], W = 600, H = 200, P = 24, max = Math.max(...all) * 1.15;
  const x = (i) => P + (i * (W - 2 * P)) / (all.length - 1), y = (v) => H - P - (v / max) * (H - 2 * P);
  const fc = [[n - 1, SALES[n - 1]], ...FORECAST.map((v, i) => [n + i, v])];
  const band = [...fc.map(([i, v]) => `${x(i)},${y(i === n - 1 ? v : v * 1.12)}`), ...[...fc].reverse().map(([i, v]) => `${x(i)},${y(i === n - 1 ? v : v * 0.88)}`)].join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Penjualan 12 minggu terakhir dan prediksi 4 minggu ke depan">
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={P} x2={W - P} y1={H - P - g * (H - 2 * P)} y2={H - P - g * (H - 2 * P)} className="stroke-on-surface/10" />)}
      <polygon points={band} className="fill-primary/15" />
      <polyline points={SALES.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
      <polyline points={fc.map(([i, v]) => `${x(i)},${y(v)}`).join(' ')} fill="none" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" className="stroke-primary" />
      <line x1={x(n - 1)} x2={x(n - 1)} y1={P / 2} y2={H - P} className="stroke-on-surface/20" strokeDasharray="3 3" />
    </svg>
  );
}

function ProductModal({ init, onSave, onClose }) {
  const [f, setF] = useState(init); const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);
  const save = (e) => {
    e.preventDefault();
    if (f.name.trim().length < 3) return setErr('Nama produk minimal 3 karakter.');
    if (!(+f.price > 0)) return setErr('Harga harus lebih dari 0.');
    if (!(+f.impact_score >= 0 && +f.impact_score <= 100)) return setErr('Skor dampak harus 0–100.');
    onSave({ ...f, price: +f.price, impact_score: +f.impact_score });
  };
  const L = ({ k, label, type = 'text' }) => <label className="block text-sm font-medium">{label}<input className="field mt-1" type={type} value={f[k]} onChange={set(k)} /></label>;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <form role="dialog" aria-modal="true" aria-label="Form produk" onClick={(e) => e.stopPropagation()} onSubmit={save} noValidate className="max-h-[92vh] w-full max-w-md space-y-3 overflow-auto rounded-m3xl bg-surface-container-high p-6 shadow-2xl">
        <h2 className="text-2xl font-bold">{init.id ? 'Edit produk' : 'Tambah produk'}</h2>
        <L k="name" label="Nama produk" /><L k="price" label="Harga (Rp)" type="number" /><L k="material" label="Material" /><L k="impact_score" label="Skor dampak (0–100)" type="number" />
        {err && <p role="alert" className="text-sm text-error">{err}</p>}
        <div className="flex gap-3 pt-2"><button type="button" className="btn-outline flex-1 !h-12" onClick={onClose}>Batal</button><button className="btn-filled flex-1 !h-12">Simpan</button></div>
      </form>
    </div>
  );
}

function Products({ notify }) {
  const { data, loading, error, reload } = useFetch('/products?sort=score');
  const [rows, setRows] = useState(null); const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null); const [del, setDel] = useState(null);
  useEffect(() => { if (data && !rows) setRows(data.map((p) => ({ ...p, active: true }))); }, [data, rows]);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!rows) return <Spinner />;
  const list = rows.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const save = (p) => { setRows(p.id ? rows.map((r) => (r.id === p.id ? { ...r, ...p } : r)) : [{ ...p, id: Date.now(), category: 'Baru', stock: 50, active: false }, ...rows]); setEdit(null); notify('Produk disimpan (demo)'); };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="field" type="search" placeholder="Cari produk…" aria-label="Cari produk" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-filled shrink-0" onClick={() => setEdit({ name: '', price: '', material: '', impact_score: 80 })}><Icon name="plus" size={16} /> Tambah</button>
      </div>
      {list.length === 0 ? <EmptyState icon="search" title="Produk tidak ditemukan" /> : (
        <Table head={['Produk', 'Kategori', 'Harga', 'Stok', 'Skor', 'Status', 'Aksi']}>
          {list.map((p) => (
            <tr key={p.id}>
              <td className={`${td} font-medium`}>{p.name}</td><td className={td}>{p.category}</td><td className={td}>{rupiah(p.price)}</td><td className={td}>{p.stock}</td><td className={td}>{p.impact_score}</td>
              <td className={td}><button onClick={() => setRows(rows.map((r) => (r.id === p.id ? { ...r, active: !r.active } : r)))} aria-label={`Ubah status ${p.name}`}><Badge s={p.active ? 'Aktif' : 'Draf'} /></button></td>
              <td className={`${td} flex`}><button className={act} aria-label={`Edit ${p.name}`} onClick={() => setEdit(p)}><Icon name="edit" size={16} /></button><button className={`${act} text-error`} aria-label={`Hapus ${p.name}`} onClick={() => setDel(p)}><Icon name="trash" size={16} /></button></td>
            </tr>
          ))}
        </Table>
      )}
      {edit && <ProductModal init={edit} onSave={save} onClose={() => setEdit(null)} />}
      <Confirm open={!!del} title="Hapus produk?" text={del ? `${del.name} akan dihapus dari daftar (demo, tidak mengubah database).` : ''} confirmLabel="Hapus" danger
        onCancel={() => setDel(null)} onConfirm={() => { setRows(rows.filter((r) => r.id !== del.id)); setDel(null); notify('Produk dihapus (demo)'); }} />
    </div>
  );
}

function AI() {
  const [msgs, setMsgs] = useState([{ r: 'ai', t: 'Halo! Tanyakan apa saja tentang stok, penjualan, pengguna, atau dampak.' }]);
  const [q, setQ] = useState(''); const [busy, setBusy] = useState(false);
  const ask = (text) => {
    if (!text.trim() || busy) return;
    setMsgs((m) => [...m, { r: 'me', t: text }]); setQ(''); setBusy(true);
    setTimeout(() => { setMsgs((m) => [...m, { r: 'ai', t: (AI_REPLIES.find(([re]) => re.test(text)) || [0, AI_FALLBACK])[1] }]); setBusy(false); }, 900);
  };
  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="flex items-center gap-2 font-display text-lg font-bold"><Icon name="sparkles" size={18} className="text-primary" />Prediksi penjualan 4 minggu</h3><span className="text-sm text-on-surface-variant">Keyakinan 86% · area = rentang prediksi</span></div>
        <LineChart />
      </section>
      <div className="grid gap-3 md:grid-cols-3">
        {[['Anomali terdeteksi', 'Penjualan Sedotan Bambu naik 48% minggu ini, kemungkinan efek kampanye.', 92], ['Segmen pengguna', '"Pemula Hijau" mencapai 38% pengguna dan paling responsif pada penjelasan skor.', 81], ['Rekomendasi stok', 'Tambah 120 unit Sikat Gigi Bambu sebelum akhir pekan.', 88]].map(([t, d, c]) => (
          <div key={t} className="card p-4"><p className="font-medium">{t}</p><p className="mt-1 text-sm text-on-surface-variant">{d}</p><p className="mt-3 text-xs text-primary">Keyakinan model {c}%</p></div>
        ))}
      </div>
      <section className="card p-5">
        <h3 className="font-display text-lg font-bold">Tanya AI <span className="ml-1 align-middle"><DemoTag /></span></h3>
        <div className="mt-3 max-h-64 space-y-2 overflow-auto" aria-live="polite">
          {msgs.map((m, i) => <p key={i} className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.r === 'me' ? 'ml-auto bg-primary text-on-primary' : 'bg-on-surface/10'}`}>{m.t}</p>)}
          {busy && <p className="w-fit rounded-2xl bg-on-surface/10 px-4 py-2 text-sm text-on-surface-variant">Menganalisis…</p>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{['Stok apa yang perlu ditambah?', 'Prediksi penjualan', 'Segmen pengguna'].map((s) => <button key={s} className="btn-tonal !h-11" onClick={() => ask(s)}>{s}</button>)}</div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tulis pertanyaan…" aria-label="Pertanyaan untuk AI" />
          <button className="btn-filled !w-11 shrink-0 !px-0" aria-label="Kirim"><Icon name="send" size={16} /></button>
        </form>
      </section>
    </div>
  );
}

export default function Admin({ user, go, notify }) {
  const [tab, setTab] = useState('ringkasan');
  const [orders, setOrders] = useState(ORDERS.map((o) => o[4]));
  const [users, setUsers] = useState(USERS.map(() => 'Aktif'));
  const [ver, setVer] = useState(VERIF.map(() => 'Menunggu'));
  if (user.username !== 'admin') return <EmptyState icon="shield" title="Akses ditolak" hint="Halaman ini hanya untuk admin." action={<button className="btn-filled" onClick={() => go('home')}>Ke beranda</button>} />;
  const step = ['Diproses', 'Dikirim', 'Selesai'];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3"><h2 className="text-3xl font-bold">Panel admin</h2><DemoTag /></div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${tab === k ? 'border-transparent bg-on-surface text-surface' : 'border-on-surface/20'}`}>{l}</button>)}
      </div>

      {tab === 'ringkasan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {KPI.map(([l, v, d]) => <div key={l} className="card p-4"><p className="text-sm text-on-surface-variant">{l}</p><p className="mt-1 font-display text-2xl font-bold md:text-3xl">{v}</p><p className="text-xs text-primary">{d} dari bulan lalu</p></div>)}
          </div>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <section className="card p-5"><h3 className="font-display text-lg font-bold">Penjualan 12 minggu</h3><LineChart /></section>
            <section className="card p-5"><h3 className="font-display text-lg font-bold">Kategori terlaris</h3>
              <ul className="mt-3 space-y-3">{CATS.map(([n, p]) => <li key={n} className="text-sm"><div className="flex justify-between"><span>{n}</span><span className="text-on-surface-variant">{p}%</span></div><div className="mt-1 h-2 rounded-full bg-on-surface/10"><div className="h-full rounded-full bg-primary" style={{ width: `${p * 2.4}%` }} /></div></li>)}</ul>
            </section>
          </div>
        </div>
      )}
      {tab === 'produk' && <Products notify={notify} />}
      {tab === 'pesanan' && (
        <Table head={['Pesanan', 'Pelanggan', 'Total', 'Metode', 'Status (ketuk untuk ubah)']}>
          {ORDERS.map(([r, n, t, m], i) => (
            <tr key={r}><td className={`${td} font-medium`}>{r}</td><td className={td}>{n}</td><td className={td}>{rupiah(t)}</td><td className={td}>{m}</td>
              <td className={td}><button className="min-h-[44px]" aria-label={`Ubah status ${r}`} onClick={() => { setOrders(orders.map((s, j) => (j === i ? step[(step.indexOf(s) + 1) % 3] : s))); notify('Status pesanan diperbarui (demo)'); }}><Badge s={orders[i]} /></button></td></tr>
          ))}
        </Table>
      )}
      {tab === 'pengguna' && (
        <Table head={['Nama', 'Username', 'Bergabung', 'Pesanan', 'Status']}>
          {USERS.map(([n, u, d, c], i) => (
            <tr key={u}><td className={`${td} font-medium`}>{n}</td><td className={td}>@{u}</td><td className={td}>{d}</td><td className={td}>{c}</td>
              <td className={td}><button className="min-h-[44px]" aria-label={`Ubah status ${n}`} onClick={() => setUsers(users.map((s, j) => (j === i ? (s === 'Aktif' ? 'Diblokir' : 'Aktif') : s)))}><Badge s={users[i]} /></button></td></tr>
          ))}
        </Table>
      )}
      {tab === 'verifikasi' && (
        <ul className="space-y-3">
          {VERIF.map(([s, p, c], i) => (
            <li key={p} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0"><p className="font-medium">{p}</p><p className="text-sm text-on-surface-variant">{s} · Sertifikat: {c}</p></div>
              {ver[i] === 'Menunggu' ? (
                <div className="flex gap-2"><button className="btn-outline" onClick={() => setVer(ver.map((v, j) => (j === i ? 'Ditolak' : v)))}>Tolak</button><button className="btn-filled" onClick={() => { setVer(ver.map((v, j) => (j === i ? 'Disetujui' : v))); notify('Produk terverifikasi (demo)'); }}>Setujui</button></div>
              ) : <Badge s={ver[i]} />}
            </li>
          ))}
        </ul>
      )}
      {tab === 'ai' && <AI />}
    </div>
  );
}
