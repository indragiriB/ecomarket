import { useState } from 'react';
import { api, setToken } from '../api';
import { Img } from '../components/ui';
import Icon from '../components/Icon';
import { HERO } from '../images';

export default function Auth({ onAuth, theme, toggleTheme }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', username: '', password: '' });
  const [show, setShow] = useState(false);
  const [st, setSt] = useState({ busy: false, error: null });
  const signup = mode === 'signup';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSt({ busy: true, error: null });
    try {
      const r = await api(`/auth/${signup ? 'signup' : 'login'}`, { method: 'POST', body: f });
      setToken(r.token);
      onAuth(r.user);
    } catch (err) { setSt({ busy: false, error: err.message }); }
  };
  const useDemo = () => { setMode('login'); setF({ name: '', username: 'admin', password: 'admin123' }); setSt({ busy: false, error: null }); };

  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      <aside className="relative hidden p-4 md:block">
        <div className="relative h-[calc(100vh-2rem)] overflow-hidden rounded-m3xl bg-primary-container">
          <Img src={HERO} alt="" className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <p className="absolute inset-x-8 bottom-8 font-display text-4xl font-bold leading-tight text-white lg:text-5xl">Belanja yang ringan untuk bumi.</p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-5 md:min-h-0 md:px-12">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-display text-xl font-bold tracking-tight"><Icon name="leaf" size={22} className="text-primary" />ecomarket</span>
          <button className="btn-tonal !h-10 !w-10 !px-0" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="mb-8 grid grid-cols-2 rounded-full bg-on-surface/10 p-1" role="tablist">
            {[['login', 'Masuk'], ['signup', 'Daftar']].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setSt({ busy: false, error: null }); }}
                className={`h-10 rounded-full text-sm font-medium transition ${mode === k ? 'bg-on-surface text-surface' : 'text-on-surface-variant'}`}>{l}</button>
            ))}
          </div>

          <h1 className="text-4xl font-bold">{signup ? 'Buat akunmu' : 'Selamat datang kembali'}</h1>
          <p className="mt-2 text-on-surface-variant">{signup ? 'Mulai catat dampak belanjamu.' : 'Masuk untuk lanjut belanja.'}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {signup && (
              <label className="block text-sm font-medium">Nama
                <input required autoComplete="name" className="field mt-1" value={f.name} onChange={set('name')} />
              </label>
            )}
            <label className="block text-sm font-medium">Username
              <input required autoComplete="username" autoCapitalize="none" spellCheck="false" className="field mt-1" value={f.username} onChange={set('username')} />
            </label>
            <label className="block text-sm font-medium">Kata sandi
              <span className="relative mt-1 block">
                <input required type={show ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} className="field !pr-12" value={f.password} onChange={set('password')} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/10">
                  <Icon name={show ? 'eyeoff' : 'eye'} size={18} />
                </button>
              </span>
            </label>
            {st.error && <p role="alert" className="rounded-m3 bg-error-container p-3 text-sm text-on-surface">{st.error}</p>}
            <button className="btn-filled w-full !h-12" disabled={st.busy}>{st.busy ? 'Memproses…' : signup ? 'Daftar' : 'Masuk'}</button>
          </form>

          <div className="mt-8 flex items-center justify-between gap-3 rounded-m3 border border-dashed border-on-surface/15 p-4 text-sm">
            <p className="text-on-surface-variant">Akun demo<br /><b className="text-on-surface">admin / admin123</b></p>
            <button type="button" className="btn-outline !h-10" onClick={useDemo}>Pakai akun ini</button>
          </div>
        </div>
      </main>
    </div>
  );
}
