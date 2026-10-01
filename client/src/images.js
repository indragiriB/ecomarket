// Gambar dari link (tidak perlu file lokal). Ganti URL di sini kapan saja.
export const HERO = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=80';
export const CTA_IMG = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1800&q=80';

// Kata kunci per id produk seed (1–12) → foto yang relevan via loremflickr
const KW = { 1: 'bamboo,straw', 2: 'bottle,steel', 3: 'cloth,cotton', 4: 'soap', 5: 'toothbrush', 6: 'coconut',
  7: 'canvas,bag', 8: 'tshirt', 9: 'lightbulb', 10: 'plant,pot', 11: 'notebook', 12: 'pen' };

export const productImg = (id, w = 600, h = 450) =>
  `https://loremflickr.com/${w}/${h}/${KW[id] || 'nature,green'}?lock=${id}`;
