import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { ago } from '../demo';

const ICON = { promo: 'bag', impact: 'leaf', tips: 'sparkles', order: 'check', info: 'bell' };

/** Lonceng + panel notifikasi (dummy) */
export function Bell({ notifs, setNotifs }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifs.filter((n) => !n.read).length;
  useEffect(() => {
    if (!open) return;
    const out = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', out); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc); };
  }, [open]);
  const read = (id) => setNotifs(notifs.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <div ref={ref} className="relative">
      <button className="btn-tonal relative !h-11 !w-11 !px-0" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Notifikasi, ${unread} belum dibaca`}>
        <Icon name="bell" size={18} />
        {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-error" />}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifikasi" className="fixed inset-x-3 top-16 z-30 max-h-[70vh] overflow-auto rounded-m3xl border border-on-surface/10 bg-surface-container-high p-3 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="font-display text-lg font-bold">Notifikasi</p>
            {unread > 0 && <button className="min-h-[44px] text-sm font-medium text-primary" onClick={() => setNotifs(notifs.map((n) => ({ ...n, read: true })))}>Tandai dibaca</button>}
          </div>
          {notifs.length === 0 ? <p className="p-4 text-center text-sm text-on-surface-variant">Belum ada notifikasi.</p> : (
            <ul>
              {notifs.map((n) => (
                <li key={n.id}>
                  <button onClick={() => read(n.id)} className="flex min-h-[56px] w-full items-start gap-3 rounded-2xl p-3 text-left hover:bg-on-surface/5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container"><Icon name={ICON[n.type] || 'bell'} size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-medium">{n.title}{!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}</span>
                      <span className="block text-sm text-on-surface-variant">{n.body}</span>
                      <span className="text-xs text-on-surface-variant">{ago(n.time)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Banner ala notifikasi push OS (dummy, hanya tampilan) */
export const PushBanner = ({ n, onClose }) => !n ? null : (
  <div role="status" className="fixed inset-x-3 top-3 z-50 flex gap-3 rounded-m3 border border-on-surface/10 bg-surface-container-high/95 p-3 shadow-2xl backdrop-blur sm:left-auto sm:right-4 sm:w-96">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary"><Icon name="leaf" size={20} /></span>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-on-surface-variant">EcoMarket · sekarang</p>
      <p className="text-sm font-medium">{n.title}</p>
      <p className="text-sm text-on-surface-variant">{n.body}</p>
    </div>
    <button onClick={onClose} aria-label="Tutup notifikasi" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-on-surface/10"><Icon name="x" size={16} /></button>
  </div>
);
