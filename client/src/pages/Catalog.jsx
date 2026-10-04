import Select from '../components/Select';
import Icon, { CAT_ICON } from '../components/Icon';
import { ProductCard, ProductGridSkeleton, ErrorState, EmptyState, ScoreInfo, GRID } from '../components/ui';
import { useFetch, usePersistentState } from '../api';

const DEFAULT = { q: '', material: '', location: '', category: '', sort: 'score', fav: false };

export default function Catalog({ go, addToCart, favs, toggleFav }) {
  // Filter tersimpan: kembali dari Detail tidak menghapus pilihan
  const [f, setF] = usePersistentState('catalog-filters', DEFAULT);
  const pick = (k) => (v) => setF({ ...f, [k]: v });
  const qs = new URLSearchParams(['q', 'material', 'location', 'category', 'sort'].filter((k) => f[k]).map((k) => [k, f[k]])).toString();

  const filters = useFetch('/filters');
  const cats = useFetch('/categories');
  const { data, loading, error, reload } = useFetch(`/products?${qs}`);
  const list = data && (f.fav ? data.filter((p) => favs.includes(p.id)) : data);
  const filtered = ['q', 'material', 'location', 'category'].some((k) => f[k]) || f.fav;
  const chip = (on) => `inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium ${on ? 'border-transparent bg-secondary-container text-on-secondary-container' : 'border-on-surface/20'}`;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-3xl font-bold">Katalog produk</h2>
        {list && <p aria-live="polite" className="text-sm text-on-surface-variant">{list.length} produk</p>}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Kategori">
        {[{ id: '', name: 'Semua' }, ...(cats.data || [])].map((c) => (
          <button key={c.id} onClick={() => setF({ ...f, category: String(c.id) })} aria-pressed={String(c.id) === f.category} className={chip(String(c.id) === f.category)}>
            <Icon name={c.id === '' ? 'grid' : CAT_ICON[c.name]} size={16} /> {c.name}
          </button>
        ))}
        <button onClick={() => setF({ ...f, fav: !f.fav })} aria-pressed={f.fav} className={chip(f.fav)}>
          <Icon name="heart" size={16} className={f.fav ? 'fill-current' : ''} /> Favorit ({favs.length})
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <input className="field col-span-2 lg:col-span-1" type="search" placeholder="Cari produk…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Cari produk" />
        <Select label="Material" value={f.material} onChange={pick('material')} placeholder="Semua material"
          options={(filters.data?.materials || []).map((m) => ({ value: m, label: m }))} />
        <Select label="Lokasi" value={f.location} onChange={pick('location')} placeholder="Semua lokasi"
          options={(filters.data?.locations || []).map((m) => ({ value: m, label: m }))} />
        <Select label="Urutkan" className="col-span-2 lg:col-span-1" value={f.sort} onChange={pick('sort')} clearable={false}
          options={[{ value: 'score', label: 'Skor dampak tertinggi' }, { value: 'price', label: 'Harga terendah' }]} />
      </div>

      <ScoreInfo />

      {loading && !data ? <ProductGridSkeleton /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState icon={f.fav && !data.length ? 'search' : f.fav ? 'heart' : 'search'}
          title={f.fav ? 'Belum ada favorit yang cocok' : 'Tidak ada produk yang cocok'}
          hint={f.fav ? 'Ketuk ikon hati pada produk untuk menyimpannya.' : 'Coba ubah atau hapus beberapa filter.'}
          action={filtered && <button className="btn-tonal" onClick={() => setF(DEFAULT)}>Reset filter</button>} />
      ) : (
        <div className={`${GRID} transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {list.map((p) => <ProductCard key={p.id} p={p} onOpen={(id) => go('detail', id)} onAdd={addToCart} fav={favs.includes(p.id)} onFav={toggleFav} />)}
        </div>
      )}
    </div>
  );
}
