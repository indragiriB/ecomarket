import { useState } from 'react';
import { rupiah } from '../api';
import { DemoTag, EmptyState } from '../components/ui';
import Confirm from '../components/Confirm';
import Icon from '../components/Icon';
import { useStored, useWallet, ago } from '../demo';

const TABS = [['profil', 'Profil', 'user'], ['integrasi', 'Integrasi', 'link'], ['notif', 'Notifikasi', 'bell'], ['dompet', 'Dompet', 'wallet']];
const INTEG = [
  ['google', 'Google Akun', 'Sinkron pengingat belanja ke kalender'], ['whatsapp', 'WhatsApp', 'Kirim status pesanan ke WhatsApp'],
  ['gopay', 'GoPay', 'Bayar cepat dengan e-wallet'], ['dana', 'DANA', 'Bayar cepat dengan e-wallet'], ['kurir', 'Kurir (JNE/SiCepat)', 'Lacak pengiriman otomatis'],
];
const NOTIF_TYPES = [['order', 'Status pesanan'], ['impact', 'Pencapaian dampak'], ['promo', 'Promo & diskon'], ['tips', 'Tips hijau']];

const Toggle = ({ on, onChange, label }) => (
  <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="flex h-11 w-14 shrink-0 items-center justify-center">
    <span className={`flex h-7 w-12 items-center rounded-full p-1 transition-all ${on ? 'justify-end bg-primary' : 'justify-start bg-on-surface/25'}`}><span className="h-5 w-5 rounded-full bg-surface" /></span>
  </button>
);

export default function Account({ user, go, notify, theme, toggleTheme, requestLogout, nset, setNset, pushNotif }) {
  const [tab, setTab] = useState('profil');
  const [integ, setInteg] = useStored('eco-integrations', {});
  const [w, setW] = useWallet(user.username);
  const [ask, setAsk] = useState(null); // {title,text,label,run}
  const isAdmin = user.username === 'admin';

  const connect = (k, name) => integ[k] ? (setInteg({ ...integ, [k]: false }), notify(`${name} diputus`))
    : setAsk({ title: `Hubungkan ${name}?`, text: 'Simulasi: tidak ada data yang dikirim ke pihak ketiga.', label: 'Hubungkan', run: () => { setInteg({ ...integ, [k]: true }); notify(`${name} terhubung (demo)`); } });
  const setPush = (on) => on
    ? setAsk({ title: 'Izinkan notifikasi?', text: 'EcoMarket ingin mengirim notifikasi tentang pesanan dan tips hijau. (Simulasi izin browser)', label: 'Izinkan',
        run: () => { setNset({ ...nset, push: true }); setTimeout(() => pushNotif('Notifikasi aktif', 'Kamu akan menerima kabar pesanan dan tips hijau.'), 1200); } })
    : setNset({ ...nset, push: false });
  const topUp = (n) => setAsk({ title: `Isi saldo ${rupiah(n)}?`, text: 'Simulasi top-up via transfer bank. Tidak ada uang sungguhan yang berpindah.', label: 'Isi saldo',
    run: () => { setW({ balance: w.balance + n, tx: [{ id: Date.now(), label: 'Isi saldo (transfer bank)', amount: n, date: new Date().toISOString() }, ...w.tx] }); notify(`Saldo bertambah ${rupiah(n)}`); } });

  const row = 'flex items-center justify-between gap-3 border-t border-on-surface/10 py-2 first:border-0';
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Akun</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="tablist">
        {TABS.map(([k, l, i]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium ${tab === k ? 'border-transparent bg-on-surface text-surface' : 'border-on-surface/20'}`}><Icon name={i} size={16} />{l}</button>
        ))}
      </div>

      {tab === 'profil' && (
        <div className="max-w-xl space-y-4">
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container font-display text-2xl font-bold text-on-primary-container">{user.name[0]}</span>
            <div><p className="font-display text-xl font-bold">{user.name}</p><p className="text-sm text-on-surface-variant">@{user.username}{isAdmin && ' · Admin'}</p></div>
          </div>
          {isAdmin && <button className="btn-filled w-full !h-12" onClick={() => go('admin')}><Icon name="shield" size={18} /> Buka panel admin</button>}
          <div className="card px-5 py-3">
            <div className={row}><span>Mode gelap</span><Toggle on={theme === 'dark'} onChange={toggleTheme} label="Mode gelap" /></div>
          </div>
          <button className="btn-outline w-full !h-12" onClick={requestLogout}><Icon name="logout" size={18} /> Keluar</button>
        </div>
      )}

      {tab === 'integrasi' && (
        <div className="max-w-xl space-y-3">
          <p className="flex items-center gap-2 text-sm text-on-surface-variant">Integrasi pihak ketiga <DemoTag /></p>
          <div className="card px-5 py-3">
            {INTEG.map(([k, n, d]) => (
              <div key={k} className={row}>
                <div className="min-w-0"><p className="font-medium">{n}</p><p className="text-sm text-on-surface-variant">{d}</p></div>
                <button className={integ[k] ? 'btn-tonal' : 'btn-outline'} onClick={() => connect(k, n)} aria-pressed={!!integ[k]}>{integ[k] ? 'Terhubung' : 'Hubungkan'}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'notif' && (
        <div className="max-w-xl space-y-3">
          <p className="flex items-center gap-2 text-sm text-on-surface-variant">Notifikasi push <DemoTag /></p>
          <div className="card px-5 py-3">
            <div className={row}><div><p className="font-medium">Aktifkan notifikasi push</p><p className="text-sm text-on-surface-variant">Banner muncul saat ada kabar baru.</p></div><Toggle on={nset.push} onChange={setPush} label="Notifikasi push" /></div>
            {NOTIF_TYPES.map(([k, l]) => <div key={k} className={row}><span>{l}</span><Toggle on={nset[k]} onChange={(v) => setNset({ ...nset, [k]: v })} label={l} /></div>)}
          </div>
          <button className="btn-outline" onClick={() => pushNotif('Notifikasi uji', 'Ini contoh notifikasi push dari EcoMarket.', 'tips')}><Icon name="send" size={16} /> Kirim notifikasi uji</button>
        </div>
      )}

      {tab === 'dompet' && (
        <div className="max-w-xl space-y-4">
          <div className="rounded-m3xl bg-primary-container p-6 text-on-primary-container">
            <p className="flex items-center gap-2 text-sm">Saldo EcoPay <DemoTag /></p>
            <p className="mt-1 font-display text-4xl font-bold">{rupiah(w.balance)}</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Isi saldo</p>
            <div className="grid grid-cols-3 gap-2">{[50000, 100000, 200000].map((n) => <button key={n} className="btn-outline" onClick={() => topUp(n)}>+{n / 1000}rb</button>)}</div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Riwayat transaksi</p>
            {w.tx.length === 0 ? <EmptyState icon="wallet" title="Belum ada transaksi" /> : (
              <ul className="card px-5 py-1">
                {w.tx.slice(0, 10).map((t) => (
                  <li key={t.id} className={`${row} !py-3`}>
                    <div><p className="text-sm font-medium">{t.label}</p><p className="text-xs text-on-surface-variant">{ago(t.date)}</p></div>
                    <b className={t.amount > 0 ? 'text-primary' : ''}>{t.amount > 0 ? '+' : '−'}{rupiah(Math.abs(t.amount))}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Confirm open={!!ask} title={ask?.title} text={ask?.text} confirmLabel={ask?.label} onCancel={() => setAsk(null)} onConfirm={() => { ask.run(); setAsk(null); }} />
    </div>
  );
}
