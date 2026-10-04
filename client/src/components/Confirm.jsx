import { useEffect, useRef } from 'react';

/** Dialog konfirmasi tindakan (Esc / klik latar = batal) */
export default function Confirm({ open, title, text, confirmLabel = 'Ya, lanjut', danger = false, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const k = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="cf-title" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-m3xl bg-surface-container-high p-6 shadow-2xl">
        <h2 id="cf-title" className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-on-surface-variant">{text}</p>
        <div className="mt-6 flex gap-3">
          <button ref={ref} className="btn-outline flex-1 !h-12" onClick={onCancel}>Batal</button>
          <button className={`btn flex-1 !h-12 ${danger ? 'bg-error text-surface' : 'bg-on-surface text-surface'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
