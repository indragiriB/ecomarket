import { useState } from 'react';
import { api } from '../api';
import Icon from '../components/Icon';

const EMPTY = { name: '', email: '', subject: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact({ go, user }) {
  const [form, setForm] = useState({ ...EMPTY, name: user?.name || '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', text: '', id: null });
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
    setStatus((s) => (s.type === 'error' ? { type: '', text: '', id: null } : s));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = 'Nama wajib diisi.';
    if (!EMAIL_RE.test(form.email.trim())) er.email = 'Masukkan alamat email yang valid.';
    if (form.message.trim().length < 10) er.message = 'Pesan minimal 10 karakter.';
    return er;
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = validate();
    if (Object.keys(er).length) {
      setErrors(er);
      setStatus({ type: 'error', text: 'Periksa kembali data yang kamu isi.', id: null });
      return;
    }
    setBusy(true);
    setStatus({ type: '', text: '', id: null });
    try {
      const res = await api('/contact', { method: 'POST', body: form });
      setStatus({ type: 'success', text: res.message, id: res.id });
      setForm({ ...EMPTY, name: user?.name || '' });
      setErrors({});
    } catch (err) {
      setErrors(err.fields || {});
      setStatus({ type: 'error', text: err.message, id: null });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStatus({ type: '', text: '', id: null });
    setErrors({});
    setForm({ ...EMPTY, name: user?.name || '' });
  };

  const fieldError = (key) => errors[key] && (
    <span id={`contact-${key}-error`} className="mt-1.5 block text-sm text-error">{errors[key]}</span>
  );

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Hubungi kami</p>
        <h2 className="mt-3 text-4xl font-bold md:text-6xl">Ada pertanyaan atau masukan?</h2>
        <p className="mt-5 text-lg text-on-surface-variant">
          Kirim pesan lewat form ini. Tim EcoMarket akan membalas ke alamat email yang kamu cantumkan.
          Data hanya dipakai untuk menindaklanjuti pesan, tidak dibagikan ke pihak lain.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {status.type === 'success' ? (
            <div className="rounded-m3xl border border-primary/30 bg-primary-container/50 p-7 md:p-10" role="status">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary">
                <Icon name="check" size={28} />
              </span>
              <h3 className="mt-5 text-3xl font-bold">Pesan berhasil dikirim</h3>
              <p className="mt-2 text-on-surface-variant">
                {status.text}{status.id ? ` Nomor pesan: #${status.id}.` : ''}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button className="btn-filled" onClick={reset}>Kirim pesan lain</button>
                <button className="btn-tonal" onClick={() => go('home')}>Kembali ke beranda</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="rounded-m3xl border border-on-surface/10 bg-surface-container p-5 md:p-8">
              {status.type === 'error' && (
                <p role="alert" className="mb-5 rounded-m3 bg-error-container p-4 text-sm text-on-surface">
                  {status.text}
                </p>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  Nama lengkap <span className="text-error" aria-hidden="true">*</span>
                  <input
                    className="field mt-1.5"
                    value={form.name}
                    onChange={set('name')}
                    autoComplete="name"
                    placeholder="Nama kamu"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  />
                  {fieldError('name')}
                </label>

                <label className="block text-sm font-medium">
                  Email <span className="text-error" aria-hidden="true">*</span>
                  <input
                    className="field mt-1.5"
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                    placeholder="nama@email.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  />
                  {fieldError('email')}
                </label>
              </div>

              <label className="mt-5 block text-sm font-medium">
                Subjek
                <input
                  className="field mt-1.5"
                  value={form.subject}
                  onChange={set('subject')}
                  placeholder="Misalnya: pertanyaan tentang produk"
                  maxLength={120}
                />
              </label>

              <label className="mt-5 block text-sm font-medium">
                Pesan <span className="text-error" aria-hidden="true">*</span>
                <textarea
                  className="mt-1.5 min-h-40 w-full resize-y rounded-m3 border border-on-surface/15 bg-transparent px-4 py-3 text-base placeholder:text-on-surface-variant"
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Tulis pertanyaan atau masukanmu di sini…"
                  maxLength={2000}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                />
                <span className="mt-1 flex justify-between gap-3 text-xs text-on-surface-variant">
                  <span>{fieldError('message')}</span>
                  <span>{form.message.length}/2000</span>
                </span>
              </label>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button className="btn-filled !h-12 !px-6" disabled={busy}>
                  <Icon name="send" size={18} /> {busy ? 'Mengirim…' : 'Kirim pesan'}
                </button>
                <p className="text-xs text-on-surface-variant">Kolom bertanda <span className="text-error">*</span> wajib diisi.</p>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-m3xl bg-primary-container p-6 text-on-primary-container">
            <h3 className="text-xl font-bold">Informasi kontak</h3>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex gap-3">
                <Icon name="send" size={18} className="mt-0.5 shrink-0" />
                <span><b className="block font-medium">Email</b>halo@ecomarket.example</span>
              </li>
              <li className="flex gap-3">
                <Icon name="globe" size={18} className="mt-0.5 shrink-0" />
                <span><b className="block font-medium">Lokasi</b>Surakarta, Indonesia</span>
              </li>
              <li className="flex gap-3">
                <Icon name="info" size={18} className="mt-0.5 shrink-0" />
                <span><b className="block font-medium">Waktu respons</b>1–2 hari kerja</span>
              </li>
            </ul>
          </div>
          <div className="rounded-m3 border border-on-surface/10 p-5 text-sm text-on-surface-variant">
            <p className="flex items-center gap-2 font-medium text-on-surface"><Icon name="shield" size={18} /> Privasi</p>
            <p className="mt-2">Nama, email, dan isi pesan disimpan hanya untuk keperluan tindak lanjut. Jangan kirim kata sandi, token, atau data sensitif lewat form ini.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
