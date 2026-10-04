import { useState } from 'react';
import { productImg } from '../images';
import Icon from './Icon';

export const idr = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

// Satu kolom di mobile, 2 di tablet (768+), 3–4 di desktop (1024/1280+)
export const GRID = 'grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2 md:gap-y-10 lg:grid-cols-3 xl:grid-cols-4';

export const scoreLevel = (s) => s >= 85
  ? { label: 'Sangat baik', tone: 'bg-primary text-on-primary' }
  : s >= 70 ? { label: 'Baik', tone: 'bg-primary-container text-on-primary-container' }
  : { label: 'Cukup', tone: 'bg-surface-variant text-on-surface' };

export function Img({ src, alt = '', className = '' }) {
  const [bad, setBad] = useState(false);
  if (bad) return <div className={`flex items-center justify-center bg-primary-container text-primary ${className}`}><Icon name="leaf" size={36} /></div>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={`object-cover ${className}`} />;
}

export const Skeleton = ({ className = '' }) => <div aria-hidden="true" className={`animate-pulse rounded-xl bg-on-surface/10 ${className}`} />;

export const ProductGridSkeleton = ({ n = 8 }) => (
  <div role="status" aria-label="Memuat produk" className={GRID}>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="flex gap-4 md:block">
        <Skeleton className="h-32 w-32 shrink-0 !rounded-[28px] md:aspect-[4/5] md:h-auto md:w-full" />
        <div className="flex-1 space-y-2 py-2 md:mt-3 md:py-0"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-4 w-1/3" /></div>
      </div>
    ))}
  </div>
);

export const Spinner = ({ label = 'Memuat…' }) => (
  <div role="status" className="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />{label}
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

/** Skor dampak sebagai cincin: terbaca sekilas */
export const ScoreBadge = ({ score, big = false }) => {
  const r = 15, C = 2 * Math.PI * r;
  return (
    <span title={`Skor dampak ${score} dari 100 (${scoreLevel(score).label})`}
      className={`relative inline-flex items-center justify-center rounded-full bg-surface/85 backdrop-blur ${big ? 'h-20 w-20' : 'h-9 w-9 md:h-10 md:w-10'}`}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3" className="stroke-on-surface/10" />
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-primary"
          strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} />
      </svg>
      <span className={big ? 'font-display text-2xl font-bold' : 'text-[11px] font-semibold'}>{score}<span className="sr-only"> dari 100</span></span>
    </span>
  );
};

/** Penjelasan skor: memenuhi indikator "80% memahami skor tanpa bantuan" */
export const ScoreInfo = () => (
  <details className="rounded-m3 border border-on-surface/10 px-4 text-sm">
    <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 font-medium"><Icon name="info" size={18} /> Apa arti skor dampak?</summary>
    <div className="space-y-3 pb-4 text-on-surface-variant">
      <p>Skor 0–100 menggabungkan asal material, jejak karbon, dan limbah yang dihindari. Semakin tinggi, semakin ramah bumi.</p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {[[92, '85–100', 'Sangat baik'], [78, '70–84', 'Baik'], [60, 'di bawah 70', 'Cukup']].map(([s, r, l]) => (
          <li key={l} className="flex items-center gap-3 rounded-xl bg-on-surface/5 p-3">
            <ScoreBadge score={s} /><span><b className="block text-on-surface">{l}</b>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  </details>
);

export const ProductCard = ({ p, onOpen, onAdd, fav, onFav }) => (
  <article className="group flex gap-4 md:block">
    <div className="relative w-32 shrink-0 overflow-hidden rounded-[28px] bg-surface-container md:w-full">
      <button onClick={() => onOpen(p.id)} className="block w-full" aria-label={`Lihat ${p.name}`}>
        <Img src={productImg(p.id)} alt="" className="aspect-square w-full transition duration-700 group-hover:scale-105 md:aspect-[4/5]" />
      </button>
      <span className="absolute left-2 top-2 md:left-3 md:top-3"><ScoreBadge score={p.impact_score} /></span>
      <button onClick={() => onFav(p)} aria-pressed={fav} aria-label={fav ? `Hapus ${p.name} dari favorit` : `Simpan ${p.name} ke favorit`}
        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center md:right-1 md:top-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/85 backdrop-blur">
          <Icon name="heart" size={16} className={fav ? 'fill-current text-error' : ''} />
        </span>
      </button>
      <button onClick={() => onAdd(p)} aria-label={`Tambah ${p.name} ke keranjang`}
        className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-surface transition hover:bg-primary hover:text-on-primary active:scale-90 md:bottom-3 md:right-3">
        <Icon name="plus" size={20} />
      </button>
    </div>
    <div className="min-w-0 flex-1 py-1 md:mt-3 md:px-1 md:py-0">
      <h3 className="font-sans text-[15px] font-medium leading-snug tracking-normal">{p.name}</h3>
      <p className="text-xs text-on-surface-variant md:text-sm">{p.material} · {p.location}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-primary"><Icon name="shield" size={14} />Terverifikasi</p>
      <p className="mt-1 text-sm font-semibold">{idr(p.price)}</p>
    </div>
  </article>
);
