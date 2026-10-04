import { useState } from 'react';
import { api, rupiah } from '../api';
import { EmptyState, Img } from '../components/ui';
import Confirm from '../components/Confirm';
import Icon from '../components/Icon';
import { productImg } from '../images';

export default function Cart({ cart, setCart, go, notify }) {
  const [del, setDel] = useState(null);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const run = async (fn, ok) => { try { setCart(await fn()); ok && notify(ok); } catch (e) { notify(e.message); } };
  const setQty = (i, qty) => qty < 1 ? setDel(i) : run(() => api(`/cart/${i.id}`, { method: 'PATCH', body: { qty } }));
  const remove = (i) => { setDel(null); run(() => api(`/cart/${i.id}`, { method: 'DELETE' }), `${i.name} dihapus dari keranjang`); };

  if (!cart.length) return (
    <EmptyState icon="bag" title="Keranjangmu masih kosong" hint="Pilih produk dengan skor dampak tinggi untuk memulai."
      action={<button className="btn-filled" onClick={() => go('catalog')}>Jelajahi katalog</button>} />
  );

  const round = 'flex h-11 w-11 items-center justify-center rounded-full hover:bg-on-surface/10';
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
                <div className="flex items-center rounded-full bg-on-surface/10">
                  <button className={round} onClick={() => setQty(i, i.qty - 1)} aria-label={`Kurangi jumlah ${i.name}`}><Icon name="minus" size={16} /></button>
                  <span className="w-7 text-center text-sm font-medium" aria-live="polite">{i.qty}</span>
                  <button className={round} onClick={() => setQty(i, i.qty + 1)} aria-label={`Tambah jumlah ${i.name}`}><Icon name="plus" size={16} /></button>
                </div>
                <button className="flex h-11 w-11 items-center justify-center rounded-full text-error hover:bg-error-container" onClick={() => setDel(i)} aria-label={`Hapus ${i.name}`}><Icon name="trash" size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className="card sticky bottom-24 z-10 h-fit space-y-3 p-5 shadow-xl lg:top-24 lg:bottom-auto lg:shadow-none">
        <p className="font-display text-lg font-bold">Ringkasan</p>
        <div className="flex justify-between text-sm"><span>Subtotal</span><b>{rupiah(total)}</b></div>
        <div className="flex justify-between text-sm text-primary"><span>Limbah berkurang</span><b>{cart.reduce((s, i) => s + i.waste_saved_kg * i.qty, 0).toFixed(1)} kg</b></div>
        <button className="btn-filled w-full !h-12" onClick={() => go('checkout')}>Lanjut ke checkout</button>
      </aside>
      <Confirm open={!!del} title="Hapus dari keranjang?" text={del ? `${del.name} akan dihapus dari keranjangmu.` : ''}
        confirmLabel="Hapus" danger onConfirm={() => remove(del)} onCancel={() => setDel(null)} />
    </div>
  );
}
