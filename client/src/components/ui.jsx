import { useState } from 'react';
import { productImg } from '../images';
import Icon from './Icon';

export const idr = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export function Img({ src, alt = '', className = '' }) {
  const [bad, setBad] = useState(false);
  if (bad) return <div className={`flex items-center justify-center bg-primary-container text-primary ${className}`}><Icon name="leaf" size={36} /></div>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={`object-cover ${className}`} />;
}

export const Spinner = ({ label = 'Memuat…' }) => (
  <div role="status" className="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    {label}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div role="alert" className="rounded-m3 bg-error-container p-6 text-center">
    <p className="font-semibold text-error">Data tidak bisa dimuat</p>
    <p className="mt-1 text-sm text-on-surface">{message}. Pastikan server berjalan di port 4000.</p>
    {onRetry && <button className="btn-outline mt-4" onClick={onRetry}>Coba lagi</button>}
  </div>
);

export const EmptyState = ({ icon = 'sprout', title, hint, action }) => (
  <div className="flex flex-col items-center rounded-m3xl border border-dashed border-on-surface/15 px-6 py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-primary"><Icon name={icon} size={28} /></div>
    <p className="mt-3 font-display text-xl font-medium">{title}</p>
    {hint && <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{hint}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/** Skor dampak sebagai cincin kecil: terbaca sekilas tanpa label */
export const ScoreBadge = ({ score }) => {
  const r = 15, C = 2 * Math.PI * r;
  return (
    <span title={`Skor dampak ${score}/100`} className="relative inline-flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-surface/85 backdrop-blur">
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3" className="stroke-on-surface/10" />
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-primary"
          strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} />
      </svg>
      <span className="text-[11px] font-semibold">{score}</span>
    </span>
  );
};

export const ProductCard = ({ p, onOpen, onAdd }) => (
  <article className="group">
    <div className="relative overflow-hidden rounded-[28px] bg-surface-container">
      <button onClick={() => onOpen(p.id)} className="block w-full" aria-label={`Lihat ${p.name}`}>
        <Img src={productImg(p.id)} emoji={p.emoji} alt={p.name} className="aspect-[4/5] w-full transition duration-700 group-hover:scale-105" />
      </button>
      <span className="absolute left-3 top-3"><ScoreBadge score={p.impact_score} /></span>
      <button onClick={() => onAdd(p)} aria-label={`Tambah ${p.name} ke keranjang`}
        className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-surface transition hover:bg-primary hover:text-on-primary active:scale-90 md:bottom-3 md:right-3"><Icon name="plus" size={20} /></button>
    </div>
    <div className="mt-3 px-1">
      <h3 className="font-sans text-[15px] font-medium leading-snug tracking-normal">{p.name}</h3>
      <p className="text-xs text-on-surface-variant md:text-sm">{p.material} · {p.location}</p>
      <p className="mt-1 text-sm font-semibold">{idr(p.price)}</p>
    </div>
  </article>
);
