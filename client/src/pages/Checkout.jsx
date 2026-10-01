import { useState } from 'react';
import { api, rupiah } from '../api';
import { EmptyState } from '../components/ui';

export default function Checkout({ cart, go, refreshCart }) {
  const [form, setForm] = useState({ name: '', address: '' });
  const [state, setState] = useState({ busy: false, error: null, done: null });
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null, done: null });
    try {
      const done = await api('/checkout', { method: 'POST', body: form });
      await refreshCart();
      setState({ busy: false, error: null, done });
    } catch (err) { setState({ busy: false, error: err.message, done: null }); }
  };

  if (state.done) return (
    <EmptyState icon="check" title="Pesanan berhasil (simulasi)"
      hint={`Nomor pesanan ${state.done.order_ref} · Total ${rupiah(state.done.total)}. Dampakmu sudah tercatat.`}
      action={<button className="btn-filled" onClick={() => go('impact')}>Lihat dampak saya</button>} />
  );
  if (!cart.length) return <EmptyState icon="bag" title="Tidak ada yang di-checkout" action={<button className="btn-filled" onClick={() => go('catalog')}>Ke katalog</button>} />;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-2xl font-extrabold">Checkout</h2>
        <label className="block text-sm font-semibold">Nama penerima
          <input required className="field mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold">Alamat pengiriman
          <textarea required rows={3} className="mt-1 w-full rounded-m3 border border-on-surface/15 bg-transparent p-3 text-base" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        {state.error && <p role="alert" className="rounded-m3 bg-error-container p-3 text-sm text-error">{state.error}</p>}
      </div>
      <div className="card h-fit space-y-2 p-5">
        <p className="font-bold">Pesananmu</p>
        {cart.map((i) => <div key={i.id} className="flex justify-between text-sm"><span>{i.qty}× {i.name}</span><span>{rupiah(i.price * i.qty)}</span></div>)}
        <div className="flex justify-between border-t border-outline/30 pt-3 text-lg font-extrabold"><span>Total</span><span className="text-primary">{rupiah(total)}</span></div>
        <button className="btn-filled w-full" disabled={state.busy}>{state.busy ? 'Memproses…' : 'Bayar sekarang'}</button>
      </div>
    </form>
  );
}
