import { useCallback, useEffect, useState } from 'react';

export const getToken = () => { try { return localStorage.getItem('token'); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem('token', t) : localStorage.removeItem('token'); } catch {} };

export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(getToken() && { Authorization: `Bearer ${getToken()}` }) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('auth:expired'));
    const err = new Error(data.error || 'Permintaan gagal. Coba lagi.');
    err.fields = data.fields;
    throw err;
  }
  return data;
}

/** Hook fetch dengan state loading & error */
export function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e) => setState({ data: null, loading: false, error: e.message }));
  }, [path]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}

export const rupiah = (n) => 'Rp' + Number(n).toLocaleString('id-ID');

/** State yang bertahan saat berpindah halaman / refresh (sessionStorage) */
export function usePersistentState(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = sessionStorage.getItem(key); return s ? { ...initial, ...JSON.parse(s) } : initial; } catch { return initial; }
  });
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}
