/*
 * EcoCommute admin — shared guards, API wrapper and navbar.
 * Loaded on every admin page after co2.js, api.js and common.js.
 */

function adminGuard() {
  const user = Auth.getUser();
  if (!Auth.isLoggedIn() || !user || user.role !== 'admin') {
    location.href = 'admin-login.html';
    return false;
  }
  return true;
}

function logoutAdmin() {
  Auth.clear();
  location.href = 'admin-login.html';
}

/** fetch wrapper: attaches the token and logs out on 401/403 */
async function adminFetch(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the EcoCommute server. Is it running?');
  }

  const data = await res.json().catch(() => ({}));
  const accessLost = res.status === 401 ||
    (res.status === 403 && /admin access only|account no longer exists/i.test(data.error || ''));
  if (accessLost) {
    Auth.clear();
    location.href = 'admin-login.html?expired=1';
    throw new Error(data.error || 'Admin access required.');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
  return data;
}

function renderAdminNavbar() {
  const nav = document.getElementById('adminNav');
  if (!nav) return;
  const page = document.body.dataset.page;

  const link = (href, key, icon, text) =>
    `<li class="nav-item"><a class="nav-link ${page === key ? 'active' : ''}" href="${href}">
       <i class="bi ${icon} me-1"></i>${text}</a></li>`;

  nav.innerHTML = `
    <nav class="navbar navbar-expand-lg eco-navbar admin-navbar sticky-top py-2">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center" href="admin.html">
          <span class="brand-icon"><i class="bi bi-tree-fill"></i></span>EcoCommute
          <span class="admin-badge ms-2"><i class="bi bi-shield-lock"></i>Admin</span>
        </a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavMenu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="adminNavMenu">
          <ul class="navbar-nav mx-auto gap-lg-1">
            ${link('admin.html', 'admin', 'bi-speedometer2', 'Overview')}
            ${link('admin-users.html', 'admin-users', 'bi-people', 'Users')}
            ${link('admin-trips.html', 'admin-trips', 'bi-geo-alt', 'Trips')}
          </ul>
          <div class="d-flex align-items-center admin-actions mt-3 mt-lg-0">
            <a href="index.html" class="btn btn-outline-primary btn-sm"><i class="bi bi-arrow-left me-1"></i>Back to site</a>
            <button type="button" class="btn btn-light btn-sm text-danger fw-bold" id="adminLogout">
              <i class="bi bi-box-arrow-right me-1"></i>Logout</button>
          </div>
        </div>
      </div>
    </nav>`;

  document.getElementById('adminLogout').addEventListener('click', logoutAdmin);
}

/** Runs fn after the user stops typing for `ms` milliseconds */
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Renders "Showing x-y of n" with prev/next buttons (buttons carry data-page) */
function renderPager(el, { page, pages, total, pageSize }) {
  if (!total) { el.innerHTML = ''; return; }
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  el.innerHTML = `
    <span>Showing ${from}-${to} of ${fmtNum(total)}</span>
    <div class="btn-group">
      <button class="btn btn-sm btn-outline-secondary" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>
      <button class="btn btn-sm btn-outline-secondary" disabled>${page} / ${pages}</button>
      <button class="btn btn-sm btn-outline-secondary" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>
    </div>`;
}

if (document.body.dataset.page !== 'admin-login' && adminGuard()) {
  renderAdminNavbar();
}