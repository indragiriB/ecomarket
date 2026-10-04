import { useFetch } from '../api';
import Icon from '../components/Icon';
import { ProductCard, ProductGridSkeleton, ErrorState, Img, GRID } from '../components/ui';
import { HERO, CTA_IMG, productImg } from '../images';

const WAYS = [
  ['Material', 'Dari mana bahannya berasal, dan apakah bisa terurai atau didaur ulang.'],
  ['Jejak karbon', 'Perkiraan CO₂ yang dihemat dibanding produk sekali pakai.'],
  ['Limbah', 'Berapa kilogram sampah yang tidak jadi terbuang.'],
];

export default function Home({ go, addToCart, favs, toggleFav }) {
  const stats = useFetch('/stats');
  const recs = useFetch('/products?sort=score');
  const top = recs.data?.[0];
  const s = stats.data;

  return (
    <div className="space-y-24 md:space-y-32">
      {/* Hero: tipografi dulu, foto berbentuk lengkung */}
      <section className="grid items-center gap-12 pt-4 md:grid-cols-12 md:pt-10">
        <div className="md:col-span-7">
          <h2 className="text-5xl font-bold leading-[0.95] sm:text-6xl md:text-8xl">
            Belanja yang ringan untuk bumi.
          </h2>
          <p className="mt-6 max-w-md text-lg text-on-surface-variant">
            Setiap produk punya skor dampak yang bisa kamu baca sebelum membeli.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="btn-filled !h-12 !px-7" onClick={() => go('catalog')}>Jelajahi katalog <Icon name="out" size={16} /></button>
            <button className="btn-outline !h-12 !px-7" onClick={() => go('impact')}>Dampak saya</button>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-on-surface/10 pt-6">
            {[['Produk', s?.products], ['Limbah berkurang', s && `${s.waste_reduced} kg`], ['CO₂ dihemat', s && `${s.co2_reduced} kg`]].map(([l, v]) => (
              <div key={l}>
                <dd className="font-display text-2xl font-bold md:text-3xl">{stats.error ? '–' : v ?? '…'}</dd>
                <dt className="text-sm text-on-surface-variant">{l}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-sm md:col-span-5 md:max-w-none">
          <Img src={HERO} alt="Lahan hijau" className="aspect-[4/5] w-full rounded-t-[999px] rounded-b-[36px]" />
          {top && (
            <button onClick={() => go('detail', top.id)}
              className="absolute -bottom-5 -left-2 flex max-w-[calc(100%-0.5rem)] -rotate-2 items-center gap-3 rounded-full bg-surface p-2 pr-6 text-left shadow-2xl transition hover:rotate-0 md:-left-12">
              <Img src={productImg(top.id, 120, 120)} emoji={top.emoji} className="h-12 w-12 rounded-full" />
              <span className="text-sm"><b className="block font-medium">{top.name}</b><span className="text-on-surface-variant">Skor tertinggi · {top.impact_score}</span></span>
            </button>
          )}
        </div>
      </section>

      {/* Rekomendasi */}
      <section>
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-4xl font-bold md:text-5xl">Pilihan hijau</h2>
          <button className="text-sm font-medium underline underline-offset-4" onClick={() => go('catalog')}>Lihat semua</button>
        </div>
        {recs.loading && !recs.data ? <ProductGridSkeleton n={4} /> : recs.error ? <ErrorState message={recs.error} onRetry={recs.reload} /> : (
          <div className={GRID}>
            {recs.data.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} onOpen={(id) => go('detail', id)} onAdd={addToCart} fav={favs.includes(p.id)} onFav={toggleFav} />)}
          </div>
        )}
      </section>

      {/* Cara menilai */}
      <section className="grid gap-10 md:grid-cols-12">
        <h2 className="text-4xl font-bold md:col-span-5 md:text-5xl">Skor dampak, dijelaskan sederhana.</h2>
        <div className="grid gap-8 md:col-span-7 md:grid-cols-3">
          {WAYS.map(([t, d]) => (
            <div key={t} className="border-t border-on-surface/15 pt-4">
              <h3 className="text-lg font-bold">{t}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Penutup */}
      <section className="relative isolate overflow-hidden rounded-m3xl bg-primary-container">
        <img src={CTA_IMG} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <div className="flex min-h-[320px] flex-col items-start justify-end gap-6 p-8 md:p-14">
          <h2 className="max-w-xl text-4xl font-bold text-on-primary-container md:text-6xl">Mulai dari satu barang.</h2>
          <button className="btn-filled !h-12 !px-7" onClick={() => go('catalog')}>Pilih produk pertamamu</button>
        </div>
      </section>
    </div>
  );
}
