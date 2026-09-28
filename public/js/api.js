/*
 * EcoCommute – API helper
 * Wraps fetch() so every page can call the backend with one line:
 *     const data = await api('/api/trips', { method: 'POST', body: {...} });
 */

// When the page is served by our Express server, use the same origin.
// If someone opens the HTML file directly (file://), fall back to the local server.
const API_BASE = location.protocol === 'file:' ? 'http://localhost:3000' : '';

const Auth = {
  getToken: () => localStorage.getItem('eco_token'),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('eco_user')); } catch { return null; }
  },
  isLoggedIn: () => !!localStorage.getItem('eco_token'),
  save(token, user) {
    localStorage.setItem('eco_token', token);
    localStorage.setItem('eco_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('eco_token');
    localStorage.removeItem('eco_user');
  }
};

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new Error('Cannot reach the EcoCommute server. Is it running? (double-click start.bat)');
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token && !path.startsWith('/api/auth/login')) {
    // Token expired or invalid → log out and go to login
    Auth.clear();
    location.href = 'login.html?expired=1';
    throw new Error(data.error || 'Session expired');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
  return data;
}
