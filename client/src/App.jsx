import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Detail from './pages/Detail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Impact from './pages/Impact';
import Icon from './components/Icon';
import Confirm from './components/Confirm';
import { Spinner } from './components/ui';

const NAV = [
  { key: 'home', label: 'Beranda' },
  { key: 'catalog', label: 'Katalog' },
  { key: 'impact', label: 'Dampak saya' },
];

export default function App() {
  const [view, setView] = useState({ name: 'home' });
  const [cart, setCart] = useState([]);
  const [favs, setFavs] = useState([]);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  const go = useCallback((name, id) => {
    setView({ name, id });
    window.scrollTo(0, 0);
    setTimeout(() => document.getElementById('konten')?.focus({ preventScroll: true }), 0);
  }, []);
  const notify = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); }, []);
  const refreshCart = useCallback(() => api('/cart').then(setCart).catch(() => {}), []);

  const clearSession = useCallback(() => {
    setToken(null); setUser(null); setCart([]); setFavs([]); setView({ name: 'home' });
    try { sessionStorage.clear(); } catch {}
  }, []);
  const logout = () => { api('/auth/logout', { method: 'POST' }).catch(() => {}); setAskLogout(false); clearSession(); };

  useEffect(() => {
    if (!getToken()) { setAuthReady(true); return; }
    api('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setAuthReady(true));
  }, []);
  useEffect(() => { if (user) { refreshCart(); api('/favorites').then(setFavs).catch(() => {}); } }, [user, refreshCart]);
  useEffect(() => { // sesi kedaluwarsa dari server
    window.addEventListener('auth:expired', clearSession);
    return () => window.removeEventListener('auth:expired', clearSession);
  }, [clearSession]);

  const addToCart = async (p) => {
    try { setCart(await api('/cart', { method: 'POST', body: { product_id: p.id } })); notify(`${p.name} masuk keranjang`); }
    catch (e) { notify(e.message); }
  };
  const toggleFav = async (p) => {
    const on = favs.includes(p.id), before = favs;
    setFavs(on ? favs.filter((i) => i !== p.id) : [...favs, p.id]);
    try { setFavs(await api(`/favorites/${p.id}`, { method: on ? 'DELETE' : 'PUT' })); notify(on ? 'Dihapus dari favorit' : `${p.name} disimpan ke favorit`); }
    catch (e) { setFavs(before); notify(e.message); }
  };

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const active = view.name === 'detail' ? 'catalog' : view.name === 'checkout' ? 'cart' : view.name;
  const ctx = { go, addToCart, cart, setCart, refreshCart, notify, favs, toggleFav, user };
  const dark = theme === 'dark';

  if (!authReady) return <Spinner />;
  if (!user) return <Auth onAuth={setUser} theme={theme} toggleTheme={() => setTheme(dark ? 'light' : 'dark')} />;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-on-surface focus:px-4 focus:py-2 focus:text-surface">Lewati ke konten</a>

      <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <button onClick={() => go('home')} className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <Icon name="leaf" size={22} className="text-primary" />ecomarket
          </button>
          <nav aria-label="Navigasi utama" className="hidden gap-8 md:flex">
            {NAV.map((n) => (
              <button key={n.key} onClick={() => go(n.key)} aria-current={active === n.key ? 'page' : undefined}
                className={`relative min-h-[44px] text-sm font-medium transition ${active === n.key ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {n.label}
                {active === n.key && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="mr-1 hidden text-sm text-on-surface-variant lg:block">Halo, {user.name.split(' ')[0]}</span>
            <button className="btn-tonal !h-11 !w-11 !px-0" onClick={() => setTheme(dark ? 'light' : 'dark')}
              aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}><Icon name={dark ? 'sun' : 'moon'} size={18} /></button>
            <button className="btn-filled !h-11 !px-3 sm:!px-5" onClick={() => go('cart')} aria-label={`Keranjang, ${count} item`}>
              <Icon name="bag" size={18} /><span className="hidden sm:inline">Keranjang</span>
              {count > 0 && <span className="rounded-full bg-primary px-2 text-xs text-on-primary">{count}</span>}
            </button>
            <button className="btn-tonal !h-11 !w-11 !px-0" onClick={() => setAskLogout(true)} aria-label="Keluar"><Icon name="logout" size={18} /></button>
          </div>
        </div>
      </header>

      <main id="konten" tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-32 pt-6 focus:outline-none md:px-8 md:pb-16">
        <h1 className="sr-only">EcoMarket – Belanja Ramah Bumi</h1>
        {view.name === 'home' && <Home {...ctx} />}
        {view.name === 'catalog' && <Catalog {...ctx} />}
        {view.name === 'detail' && <Detail id={view.id} {...ctx} />}
        {view.name === 'cart' && <Cart {...ctx} />}
        {view.name === 'checkout' && <Checkout {...ctx} />}
        {view.name === 'impact' && <Impact {...ctx} />}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-28 text-sm text-on-surface-variant md:px-8 md:pb-10">
        <div className="border-t border-on-surface/10 pt-6">© 2026 EcoMarket. Belanja pelan-pelan, dampaknya panjang.</div>
      </footer>

      <nav aria-label="Navigasi bawah" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        className="fixed inset-x-3 bottom-3 z-20 flex rounded-full border border-on-surface/10 bg-surface-container-high/90 p-1 shadow-xl backdrop-blur-md md:hidden">
        {[['home', 'Beranda', 'home'], ['catalog', 'Katalog', 'grid'], ['cart', 'Keranjang', 'bag'], ['impact', 'Dampak', 'globe']].map(([key, label, icon]) => (
          <button key={key} onClick={() => go(key)} aria-current={active === key ? 'page' : undefined}
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition ${active === key ? 'bg-on-surface text-surface' : 'text-on-surface-variant'}`}>
            <span className="relative">
              <Icon name={icon} size={20} />
              {key === 'cart' && count > 0 && <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-on-primary">{count}</span>}
            </span>
            {label}
          </button>
        ))}
      </nav>

      {toast && <div role="status" className="fixed bottom-24 left-1/2 z-30 w-max max-w-[90vw] -translate-x-1/2 rounded-full bg-on-surface px-5 py-3 text-sm font-medium text-surface shadow-xl md:bottom-8">{toast}</div>}

      <Confirm open={askLogout} title="Keluar dari akun?" text="Kamu perlu masuk lagi untuk melanjutkan belanja." confirmLabel="Keluar" onConfirm={logout} onCancel={() => setAskLogout(false)} />
    </div>
  );
}
