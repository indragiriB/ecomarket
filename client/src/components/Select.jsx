import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

/** Dropdown kustom: ikut tema terang/gelap di semua browser (menggantikan <select> bawaan) */
export default function Select({ label, value, onChange, options, placeholder = 'Pilih', clearable = true, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const items = clearable ? [{ value: '', label: placeholder }, ...options] : options;
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}
        className={`field flex items-center justify-between gap-2 text-left ${current ? '' : 'text-on-surface-variant'}`}>
        <span className="truncate">{current ? current.label : placeholder}</span>
        <Icon name="chevron" size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul role="listbox" aria-label={label}
          className="absolute z-30 mt-2 max-h-64 w-full min-w-[12rem] overflow-auto rounded-2xl border border-on-surface/10 bg-surface-container-high p-1 shadow-2xl">
          {items.map((o) => {
            const sel = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={sel}>
                <button type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm transition hover:bg-on-surface/10 ${sel ? 'font-medium text-primary' : ''}`}>
                  {o.label}{sel && <Icon name="tick" size={16} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
