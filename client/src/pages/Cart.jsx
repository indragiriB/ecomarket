import { api, rupiah } from '../api';
import { EmptyState, Img } from '../components/ui';
import Icon from '../components/Icon';
import { productImg } from '../images';

export default function Cart({ cart, setCart, go, notify }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const run = async (fn) => { try { setCart(await fn()); } catch (e) { notify(e.message); } };
  const setQty = (i, qty) => qty < 1 ? remove(i) : run(() => api(`/cart/${i.id}`, { method: 'PATCH', body: { qty } }));
  const remove = (i) => run(() => api(`/cart/${i.id}`, { method: 'DELETE' }));

  if (!cart.length) return (
    <EmptyState icon="bag" title="Keranjangmu masih kosong" hint="Pilih produk dengan skor dampak tinggi untuk memulai."
      action={<button className="btn-filled" onClick={() => go('catalog')}>Jelajahi katalog</button>} />
  );

  const round = 'flex h-9 w-9 items-center justify-center rounded-full hover:bg-on-surface/10';
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold">Keranjang</h2>
        {cart.map((i) => (
          <div key={i.id} className="card flex gap-4 p-3">
            <Img src={productImg(i.product_id, 200, 200)} alt="" className="h-24 w-24 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
              <div>
                <p className="font-medium leading-snug">{i.name}</p>
                <p className="text-sm text-primary">{rupiah(i.price)}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-full bg-on-surface/10 p-0.5">
                  <button className={round} onClick={() => setQty(i, i.qty - 1)} aria-label="Kurangi"><Icon name="minus" size={16} /></button>
                  <span className="w-6 text-center text-sm font-medium">{i.qty}</span>
                  <button className={round} onClick={() => setQty(i, i.qty + 1)} aria-label="Tambah"><Icon name="plus" size={16} /></button>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-error hover:bg-error-container" onClick={() => remove(i)} aria-label={`Hapus ${i.name}`}><Icon name="trash" size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
        <p className="font-display text-lg font-bold">Ringkasan</p>
        <div className="flex justify-between text-sm"><span>Subtotal</span><b>{rupiah(total)}</b></div>
        <div className="flex justify-between text-sm text-primary"><span>Limbah berkurang</span><b>{cart.reduce((s, i) => s + i.waste_saved_kg * i.qty, 0).toFixed(1)} kg</b></div>
        <button className="btn-filled w-full !h-12" onClick={() => go('checkout')}>Lanjut ke checkout</button>
      </aside>
    </div>
  );
}
