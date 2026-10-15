import { useFetch, rupiah } from '../api';
import { Spinner, ErrorState, EmptyState, DemoTag } from '../components/ui';
import Icon from '../components/Icon';

const BADGES = [
  { at: 1, label: 'Langkah pertama', icon: 'sprout', key: 'orders', unit: 'pesanan' },
  { at: 3, label: 'Pelanggan hijau', icon: 'leaf', key: 'orders', unit: 'pesanan' },
  { at: 5, label: 'Penyelamat 5 kg limbah', icon: 'award', key: 'waste', unit: 'kg' },
];
const METHOD = { transfer: 'Transfer bank', ewallet: 'E-wallet', qris: 'QRIS', ecopay: 'EcoPay', cod: 'Bayar di tempat' };
const when = (s) => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const day = (d) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' });

export default function Impact({ go }) {
  const { data, loading, error, reload } = useFetch('/impact');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { totals, orders, weekly } = data;
  const max = Math.max(0.5, ...weekly.map((w) => w.waste));
  const sum = weekly.reduce((s, w) => s + w.waste, 0).toFixed(1);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Dampak saya</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Limbah berkurang', `${totals.waste} kg`], ['CO₂ dihemat', `${totals.co2} kg`], ['Pesanan', totals.orders], ['Produk', totals.items]].map(([l, v]) => (
          <div key={l} className="card p-4"><p className="font-display text-3xl font-bold text-primary">{v}</p><p className="text-sm text-on-surface-variant">{l}</p></div>
        ))}
      </div>

      <section className="card p-5" aria-labelledby="wk">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="wk" className="font-display text-lg font-bold">Wawasan mingguan</h3>
          <p className="text-sm text-on-surface-variant">{sum} kg limbah dalam 7 hari</p>
        </div>
        <div role="img" aria-label={`Limbah berkurang per hari: ${weekly.map((w) => `${day(w.date)} ${w.waste} kg`).join(', ')}`}>
          <div className="mt-5 flex h-36 items-end gap-2 border-b border-on-surface/15">
            {weekly.map((w) => (
              <div key={w.date} title={`${w.waste} kg`} className="flex-1 rounded-t-xl bg-primary transition-all"
                style={{ height: `${w.waste ? Math.max(6, (w.waste / max) * 100) : 2}%`, opacity: w.waste ? 1 : 0.25 }} />
            ))}
          </div>
          <div className="mt-2 flex gap-2">{weekly.map((w) => <span key={w.date} className="flex-1 text-center text-xs text-on-surface-variant">{day(w.date)}</span>)}</div>
        </div>
      </section>

      <section className="rounded-m3xl bg-primary-container p-5 text-on-primary-container">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold"><Icon name="sparkles" size={18} /> Insight AI <DemoTag /></h3>
        <p className="mt-2 text-sm">
          Kamu sudah menghindari {totals.waste} kg limbah. Jika menambah satu produk bersekor ≥ 90 tiap minggu, perkiraan tambahan CO₂ yang dihemat sekitar {(Math.max(totals.co2, 2) * 0.18).toFixed(1)} kg per bulan.
        </p>
        <button className="btn-filled mt-3" onClick={() => go('catalog')}>Lihat produk skor tinggi</button>
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg font-bold">Pencapaian</h3>
        <div className="flex flex-wrap gap-2">
          {BADGES.map((b) => {
            const cur = b.key === 'orders' ? totals.orders : totals.waste;
            const ok = cur >= b.at;
            return (
              <span key={b.label} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${ok ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                <Icon name={b.icon} size={16} /> {b.label}{!ok && ` · ${cur}/${b.at} ${b.unit}`}
              </span>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg font-bold">Riwayat aktivitas</h3>
        {orders.length === 0 ? (
          <EmptyState icon="globe" title="Belum ada dampak tercatat" hint="Selesaikan checkout pertamamu untuk mulai melacak kontribusi."
            action={<button className="btn-filled" onClick={() => go('catalog')}>Mulai belanja</button>} />
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.order_ref} className="card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{o.order_ref}</p>
                  <p className="text-sm text-on-surface-variant">{when(o.created_at)} · {METHOD[o.payment_method]}</p>
                </div>
                <ul className="mt-2 divide-y divide-on-surface/10 text-sm">
                  {o.items.map((i) => (
                    <li key={i.product_name} className="flex justify-between gap-3 py-2">
                      <span>{i.qty}× {i.product_name}</span>
                      <span className="whitespace-nowrap text-primary">{i.waste_kg} kg limbah</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-right font-semibold">{rupiah(o.total)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
