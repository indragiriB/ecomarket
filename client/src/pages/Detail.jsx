import { useFetch, rupiah } from '../api';
import { ErrorState, ScoreBadge, ScoreInfo, Img, Skeleton, scoreLevel } from '../components/ui';
import Icon from '../components/Icon';
import { productImg } from '../images';

export default function Detail({ id, go, addToCart, favs, toggleFav }) {
  const { data: p, loading, error, reload } = useFetch(`/products/${id}`);
  const back = <button className="btn-outline" onClick={() => go('catalog')}><Icon name="back" size={16} /> Katalog</button>;

  if (error) return <div className="space-y-5">{back}<ErrorState message={error} onRetry={reload} /></div>;
  if (!p || String(p.id) !== String(id)) return (
    <div className="space-y-5" role="status" aria-label="Memuat produk">{back}
      <div className="grid gap-8 md:grid-cols-2"><Skeleton className="aspect-square !rounded-m3xl" />
        <div className="space-y-4"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div></div>
    </div>
  );

  const fav = favs.includes(p.id);
  const lvl = scoreLevel(p.impact_score);
  const specs = [['Kategori', p.category], ['Material', p.material], ['Asal', p.location], ['Sertifikasi', p.certification], ['Stok', `${p.stock} tersedia`]];
  return (
    <div className="space-y-5">
      {back}
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <div className="md:sticky md:top-24 md:h-fit">
          <Img src={productImg(p.id, 900, 900)} alt={p.name} className="aspect-square w-full rounded-m3xl" />
        </div>
        <div className="space-y-6">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 text-sm font-medium text-on-primary-container">
              <Icon name="shield" size={16} /> Terverifikasi · {p.certification}
            </p>
            <h2 className="mt-3 text-4xl font-bold">{p.name}</h2>
            <p className="mt-2 text-on-surface-variant">{p.description}</p>
            <p className="mt-4 font-display text-3xl font-bold">{rupiah(p.price)}</p>
          </div>

          <section aria-label="Dampak lingkungan" className="card space-y-4 p-5">
            <div className="flex items-center gap-4">
              <ScoreBadge score={p.impact_score} big />
              <div>
                <p className="text-sm text-on-surface-variant">Skor dampak lingkungan</p>
                <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium ${lvl.tone}`}>{lvl.label}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p className="rounded-xl bg-on-surface/5 p-3"><b className="block font-display text-2xl text-primary">{p.waste_saved_kg} kg</b>limbah berkurang</p>
              <p className="rounded-xl bg-on-surface/5 p-3"><b className="block font-display text-2xl text-primary">{p.co2_saved_kg} kg</b>CO₂ dihemat</p>
            </div>
            <ScoreInfo />
          </section>

          <dl className="card divide-y divide-on-surface/10 text-sm">
            {specs.map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-on-surface-variant">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
          </dl>

          {/* CTA utama selalu terjangkau di mobile */}
          <div className="sticky bottom-24 z-10 flex gap-2 rounded-full bg-surface-container-high/95 p-2 shadow-xl backdrop-blur md:static md:bg-transparent md:p-0 md:shadow-none">
            <button onClick={() => toggleFav(p)} aria-pressed={fav} aria-label={fav ? 'Hapus dari favorit' : 'Simpan ke favorit'} className="btn-outline !h-12 !w-12 shrink-0 !px-0">
              <Icon name="heart" size={20} className={fav ? 'fill-current text-error' : ''} />
            </button>
            <button className="btn-filled !h-12 flex-1" onClick={() => addToCart(p)}><Icon name="bag" size={18} /> Tambah ke keranjang</button>
          </div>
        </div>
      </div>
    </div>
  );
}
