import { useEffect, useState } from 'react';
import { rupiah } from '../api';
import { DemoTag } from './ui';
import Icon from './Icon';

const VA = '8077 0812 3456 7890';

function Qr() {
  const N = 25; let s = 7;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const finder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  const cells = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && rnd() > 0.5) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  const eye = (x, y) => <g key={`${x}${y}`} transform={`translate(${x} ${y})`}><rect width="7" height="7" /><rect x="1" y="1" width="5" height="5" className="fill-white" /><rect x="2" y="2" width="3" height="3" /></g>;
  return <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} role="img" aria-label="Kode QRIS simulasi" className="mx-auto h-44 w-44 rounded-xl bg-white fill-black p-2">{cells}{eye(0, 0)}{eye(N - 7, 0)}{eye(0, N - 7)}</svg>;
}

/** Simulasi layar pembayaran: tidak ada transaksi nyata */
export default function PaymentSheet({ method, total, wallet, onPaid, onCancel }) {
  const [phase, setPhase] = useState('pay');
  const [wl, setWl] = useState('GoPay');
  const [copied, setCopied] = useState(false);
  const [left, setLeft] = useState(900);

  useEffect(() => { const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && phase === 'pay' && onCancel();
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [phase, onCancel]);

  const short = method === 'ecopay' && wallet.balance < total;
  const expired = left === 0;
  const mmss = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  const confirm = async () => { setPhase('processing'); await new Promise((r) => setTimeout(r, 1800)); await onPaid(); };
  const copy = () => { navigator.clipboard?.writeText(VA.replace(/\s/g, '')).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={phase === 'pay' ? onCancel : undefined}>
      <div role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-auto rounded-m3xl bg-surface-container-high p-6 shadow-2xl">
        {phase === 'processing' ? (
          <div role="status" className="flex flex-col items-center gap-4 py-12">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="font-medium">Memverifikasi pembayaran…</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2"><h2 id="pay-title" className="text-2xl font-bold">Selesaikan pembayaran</h2><DemoTag /></div>
            <p className="mt-1 font-display text-3xl font-bold text-primary">{rupiah(total)}</p>
            <p className={`mt-1 text-sm ${expired ? 'text-error' : 'text-on-surface-variant'}`}>{expired ? 'Waktu pembayaran habis. Tutup dan coba lagi.' : `Bayar dalam ${mmss}`}</p>

            <div className="mt-5 space-y-3">
              {method === 'transfer' && (
                <div className="rounded-m3 bg-on-surface/5 p-4">
                  <p className="text-sm text-on-surface-variant">Virtual Account (simulasi)</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-display text-xl font-bold tracking-wide">{VA}</p>
                    <button type="button" onClick={copy} className="btn-tonal !h-11"><Icon name={copied ? 'tick' : 'copy'} size={16} />{copied ? 'Tersalin' : 'Salin'}</button>
                  </div>
                </div>
              )}
              {method === 'ewallet' && (
                <fieldset>
                  <legend className="text-sm font-medium">Pilih e-wallet</legend>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {['GoPay', 'OVO', 'DANA'].map((w) => (
                      <label key={w} className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-m3 border border-on-surface/15 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary-container">
                        <input type="radio" name="wl" className="sr-only" checked={wl === w} onChange={() => setWl(w)} />{w}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant">Di aplikasi sungguhan, kamu akan diarahkan ke {wl}.</p>
                </fieldset>
              )}
              {method === 'qris' && <div><Qr /><p className="mt-2 text-center text-sm text-on-surface-variant">Pindai dengan aplikasi pembayaran apa pun (simulasi).</p></div>}
              {method === 'ecopay' && (
                <div className="rounded-m3 bg-on-surface/5 p-4 text-sm">
                  <p className="flex justify-between"><span>Saldo EcoPay</span><b>{rupiah(wallet.balance)}</b></p>
                  <p className="mt-1 flex justify-between"><span>Sisa setelah bayar</span><b className={short ? 'text-error' : ''}>{rupiah(wallet.balance - total)}</b></p>
                  {short && <p role="alert" className="mt-2 text-error">Saldo tidak cukup. Isi saldo di Akun › Dompet.</p>}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button className="btn-outline flex-1 !h-12" onClick={onCancel}>Batal</button>
              <button className="btn-filled flex-[2] !h-12" onClick={confirm} disabled={short || expired}>Saya sudah bayar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
