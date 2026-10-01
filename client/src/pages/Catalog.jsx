import { useState } from 'react';
import { useFetch } from '../api';
import Icon, { CAT_ICON } from '../components/Icon';
import Select from '../components/Select';
import { ProductCard, Spinner, ErrorState, EmptyState } from '../components/ui';

export default function Catalog({ go, addToCart }) {
  const [f, setF] = useState({ q: '', material: '', location: '', category: '', sort: 'score' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const pick = (k) => (v) => setF({ ...f, [k]: v });
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();

  const filters = useFetch('/filters');
  const cats = useFetch('/categories');
  const { data, loading, error, reload } = useFetch(`/products?${qs}`);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-extrabold">Katalog produk</h2>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Kategori">
        {[{ id: '', name: 'Semua' }, ...(cats.data || [])].map((c) => (
          <button key={c.id} onClick={() => setF({ ...f, category: String(c.id) })}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium ${String(c.id) === f.category ? 'border-transparent bg-secondary-container text-on-secondary-container' : 'border-outline'}`}>
            <Icon name={c.id === '' ? 'grid' : CAT_ICON[c.name]} size={16} /> {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <input className="field col-span-2 lg:col-span-1" placeholder="Cari produk…" value={f.q} onChange={set('q')} aria-label="Cari produk" />
        <Select label="Material" value={f.material} onChange={pick('material')} placeholder="Semua material"
          options={(filters.data?.materials || []).map((m) => ({ value: m, label: m }))} />
        <Select label="Lokasi" value={f.location} onChange={pick('location')} placeholder="Semua lokasi"
          options={(filters.data?.locations || []).map((m) => ({ value: m, label: m }))} />
        <Select label="Urutkan" className="col-span-2 lg:col-span-1" value={f.sort} onChange={pick('sort')} clearable={false}
          options={[{ value: 'score', label: 'Skor dampak tertinggi' }, { value: 'price', label: 'Harga terendah' }]} />
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
        <EmptyState icon="search" title="Tidak ada produk yang cocok" hint="Coba ubah atau hapus beberapa filter."
          action={<button className="btn-tonal" onClick={() => setF({ q: '', material: '', location: '', category: '', sort: 'score' })}>Reset filter</button>} />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
          {data.map((p) => <ProductCard key={p.id} p={p} onOpen={(id) => go('detail', id)} onAdd={addToCart} />)}
        </div>
      )}
    </div>
  );
}
