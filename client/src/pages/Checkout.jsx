import { useState } from 'react';
import { api, rupiah, usePersistentState } from '../api';
import { EmptyState } from '../components/ui';
import Confirm from '../components/Confirm';
import Icon from '../components/Icon';

const INIT = { name: '', phone: '', address: '', method: 'transfer' };
const METHODS = [['transfer', 'Transfer bank'], ['ewallet', 'E-wallet'], ['cod', 'Bayar di tempat']];

const validate = (f) => {
  const e = {};
  if (f.name.trim().length < 3) e.name = 'Nama minimal 3 karakter.';
  if (!/^(\+62|62|0)8\d{8,11}$/.test(f.phone.replace(/[\s-]/g, ''))) e.phone = 'Nomor HP tidak valid. Contoh: 081234567890.';
  if (f.address.trim().length < 10) e.address = 'Alamat minimal 10 karakter, termasuk jalan dan kota.';
  return e;
};

export default function Checkout({ cart, go, refreshCart }) {
  // Input tersimpan: kembali ke keranjang tidak menghapus isian
  const [f, setF] = usePersistentState('checkout-form', INIT);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [srv, setSrv] = useState({});
  const [ask, setAsk] = useState(false);
  const [st, setSt] = useState({ busy: false, error: null, done: null });

  const errs = { ...validate(f), ...srv };
  const show = (k) => (touched[k] || submitted) && errs[k];
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const bind = (k) => ({
    id: `f-${k}`, value: f[k], 'aria-invalid': !!show(k), 'aria-describedby': show(k) ? `f-${k}-err` : undefined,
    onChange: (e) => { setF({ ...f, [k]: e.target.value }); setSrv({}); },
    onBlur: () => setTouched({ ...touched, [k]: true }),
  });
  const Err = ({ k }) => show(k) ? <p id={`f-${k}-err`} role="alert" className="mt-1 text-sm text-error">{errs[k]}</p> : null;
  const inv = (k) => (show(k) ? '!border-error' : '');

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const bad = Object.keys(validate(f))[0];
    if (bad) { document.getElementById(`f-${bad}`)?.focus(); return; }
    setAsk(true);
  };
  const pay = async () => {
    setAsk(false); setSt({ busy: true, error: null, done: null });
    try {
      const done = await api('/checkout', { method: 'POST', body: { name: f.name, phone: f.phone, address: f.address, payment_method: f.method } });
      await refreshCart(); setF(INIT);
      setSt({ busy: false, error: null, done });
    } catch (err) { setSrv(err.fields || {}); setSt({ busy: false, error: err.message, done: null }); }
  };

  if (st.done) return (
    <EmptyState icon="check" title="Pesanan berhasil (simulasi)"
      hint={`Nomor pesanan ${st.done.order_ref} · Total ${rupiah(st.done.total)}. Dampak positifmu sudah tercatat.`}
      action={<div className="flex flex-wrap justify-center gap-2"><button className="btn-filled" onClick={() => go('impact')}>Lihat dampak saya</button><button className="btn-outline" onClick={() => go('catalog')}>Belanja lagi</button></div>} />
  );
  if (!cart.length) return <EmptyState icon="bag" title="Tidak ada yang di-checkout" hint="Tambahkan produk ke keranjang dulu." action={<button className="btn-filled" onClick={() => go('catalog')}>Ke katalog</button>} />;

  const method = METHODS.find(([k]) => k === f.method)[1];
  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <button type="button" className="btn-outline" onClick={() => go('cart')}><Icon name="back" size={16} /> Keranjang</button>
        <h2 className="text-3xl font-bold">Checkout</h2>

        <div>
          <label htmlFor="f-name" className="block text-sm font-medium">Nama penerima</label>
          <input {...bind('name')} autoComplete="name" className={`field mt-1 ${inv('name')}`} />
          <Err k="name" />
        </div>
        <div>
          <label htmlFor="f-phone" className="block text-sm font-medium">Nomor HP</label>
          <input {...bind('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="081234567890" className={`field mt-1 ${inv('phone')}`} />
          <Err k="phone" />
        </div>
        <div>
          <label htmlFor="f-address" className="block text-sm font-medium">Alamat pengiriman</label>
          <textarea {...bind('address')} rows={3} autoComplete="street-address" className={`mt-1 w-full rounded-m3 border border-on-surface/15 bg-transparent p-3 text-base ${inv('address')}`} />
          <Err k="address" />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Metode pembayaran</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {METHODS.map(([k, l]) => (
              <label key={k} className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-m3 border border-on-surface/15 px-4 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-container has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
                <input type="radio" name="method" value={k} checked={f.method === k} onChange={() => setF({ ...f, method: k })} className="accent-primary" />
                <Icon name="card" size={16} />{l}
              </label>
            ))}
          </div>
        </fieldset>

        {st.error && <p role="alert" className="rounded-m3 bg-error-container p-3 text-sm text-on-surface">{st.error}</p>}
      </div>

      <aside className="card h-fit space-y-2 p-5 lg:sticky lg:top-24">
        <p className="font-display text-lg font-bold">Pesananmu</p>
        {cart.map((i) => <div key={i.id} className="flex justify-between gap-3 text-sm"><span>{i.qty}× {i.name}</span><span className="whitespace-nowrap">{rupiah(i.price * i.qty)}</span></div>)}
        <div className="flex justify-between border-t border-on-surface/10 pt-3 text-lg font-bold"><span>Total</span><span className="text-primary">{rupiah(total)}</span></div>
        <p className="text-xs text-on-surface-variant">Simulasi: tidak ada pembayaran nyata.</p>
        <button className="btn-filled w-full !h-12" disabled={st.busy}>{st.busy ? 'Memproses…' : 'Bayar sekarang'}</button>
      </aside>

      <Confirm open={ask} title="Konfirmasi pesanan" text={`Bayar ${rupiah(total)} dengan ${method}? Ini hanya simulasi.`}
        confirmLabel="Ya, bayar" onConfirm={pay} onCancel={() => setAsk(false)} />
    </form>
  );
}
