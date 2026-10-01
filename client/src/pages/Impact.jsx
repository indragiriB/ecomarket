import { useFetch } from '../api';
import Icon from '../components/Icon';
import { Spinner, ErrorState, EmptyState } from '../components/ui';

const BADGES = [
  { at: 1, label: 'Langkah pertama', icon: 'sprout', key: 'orders' },
  { at: 3, label: 'Pelanggan hijau', icon: 'leaf', key: 'orders' },
  { at: 5, label: 'Penyelamat 5 kg limbah', icon: 'award', key: 'waste' },
];

export default function Impact({ go }) {
  const { data, loading, error, reload } = useFetch('/impact');
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { totals, history } = data;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">Dampak saya</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Limbah berkurang', `${totals.waste} kg`], ['CO₂ dihemat', `${totals.co2} kg`], ['Pesanan', totals.orders], ['Produk', totals.items]].map(([l, v]) => (
          <div key={l} className="card p-4"><p className="text-2xl font-extrabold text-primary">{v}</p><p className="text-sm text-on-surface-variant">{l}</p></div>
        ))}
      </div>

      <section>
        <h3 className="mb-3 font-bold">Pencapaian</h3>
        <div className="flex flex-wrap gap-2">
          {BADGES.map((b) => {
            const ok = (b.key === 'orders' ? totals.orders : totals.waste) >= b.at;
            return <span key={b.label} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${ok ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}><Icon name={b.icon} size={16} /> {b.label}{!ok && ' (terkunci)'}</span>;
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-bold">Riwayat</h3>
        {history.length === 0 ? (
          <EmptyState icon="globe" title="Belum ada dampak tercatat" hint="Selesaikan checkout pertamamu untuk mulai melacak kontribusi."
            action={<button className="btn-filled" onClick={() => go('catalog')}>Mulai belanja</button>} />
        ) : (
          <ul className="card divide-y divide-surface-variant">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div><p className="font-semibold">{h.qty}× {h.product_name}</p><p className="text-xs text-on-surface-variant">{h.order_ref} · {h.created_at}</p></div>
                <p className="text-right text-primary"><b>{h.waste_kg.toFixed(1)} kg</b> limbah<br />{h.co2_kg.toFixed(1)} kg CO₂</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
