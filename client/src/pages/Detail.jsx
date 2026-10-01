import { useFetch, rupiah } from '../api';
import { Spinner, ErrorState, ScoreBadge, Img } from '../components/ui';
import Icon from '../components/Icon';
import { productImg } from '../images';

export default function Detail({ id, go, addToCart }) {
  const { data: p, loading, error, reload } = useFetch(`/products/${id}`);
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const specs = [['Kategori', p.category], ['Material', p.material], ['Asal', p.location], ['Sertifikasi', p.certification], ['Stok', p.stock]];
  return (
    <div className="space-y-5">
      <button className="btn-outline" onClick={() => go('catalog')}><Icon name="back" size={16} /> Katalog</button>
      <div className="grid gap-6 md:grid-cols-2">
        <Img src={productImg(p.id, 900, 900)} emoji={p.emoji} alt={p.name} className="h-72 w-full rounded-m3xl md:h-full" />
        <div className="space-y-5">
          <div>
            <ScoreBadge score={p.impact_score} />
            <h2 className="mt-2 text-3xl font-extrabold">{p.name}</h2>
            <p className="mt-1 text-on-surface-variant">{p.description}</p>
            <p className="mt-3 text-2xl font-extrabold text-primary">{rupiah(p.price)}</p>
          </div>

          <div className="card p-4">
            <p className="font-bold">Dampak per produk</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-variant" role="progressbar" aria-valuenow={p.impact_score} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${p.impact_score}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <p><b className="text-lg text-primary">{p.waste_saved_kg} kg</b><br />limbah berkurang</p>
              <p><b className="text-lg text-primary">{p.co2_saved_kg} kg</b><br />CO₂ dihemat</p>
            </div>
          </div>

          <dl className="card divide-y divide-surface-variant text-sm">
            {specs.map(([k, v]) => <div key={k} className="flex justify-between px-4 py-3"><dt className="text-on-surface-variant">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
          </dl>

          <button className="btn-filled w-full" onClick={() => addToCart(p)}>Tambah ke keranjang</button>
        </div>
      </div>
    </div>
  );
}
