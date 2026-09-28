/*
 * EcoCommute – shared UI helpers used by every page
 *  - navbar + footer rendering
 *  - login guard
 *  - toast notifications
 *  - number / date formatting
 */

const MODES = EcoCalc.MODES;
const currentPage = document.body.dataset.page;

/* ---------- Illustration sprites + artwork backgrounds ---------- */
try {
  if (typeof injectSprites === 'function') injectSprites();
  if (typeof TREELINE_URI === 'string') document.documentElement.style.setProperty('--treeline-bg', 'url("' + TREELINE_URI + '")');
  if (typeof HERO_URI === 'string') document.documentElement.style.setProperty('--art-hero', 'url("' + HERO_URI + '")');
  if (typeof EMPTY_URI === 'string') document.documentElement.style.setProperty('--art-empty', 'url("' + EMPTY_URI + '")');
} catch (e) { /* illustrations.js is optional */ }

/* ---------- Navbar ---------- */
function renderNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const user = Auth.getUser();

  const link = (href, page, icon, text) =>
    `<li class="nav-item"><a class="nav-link ${currentPage === page ? 'active' : ''}" href="${href}">
       <i class="bi ${icon} me-1"></i>${text}</a></li>`;

  const links = user
    ? link('dashboard.html', 'dashboard', 'bi-speedometer2', 'Dashboard') +
      link('log-trip.html', 'log-trip', 'bi-plus-circle', 'Log Trip') +
      link('history.html', 'history', 'bi-clock-history', 'History') +
      link('stats.html', 'stats', 'bi-bar-chart-line', 'Monthly Stats') +
      link('leaderboard.html', 'leaderboard', 'bi-trophy', 'Leaderboard')
    : link('index.html', 'home', 'bi-house', 'Home') +
      link('index.html#calculator', 'calc', 'bi-calculator', 'Calculator') +
      link('leaderboard.html', 'leaderboard', 'bi-trophy', 'Leaderboard');

  const right = user
    ? `<div class="dropdown">
         <a href="#" class="d-flex align-items-center text-decoration-none dropdown-toggle text-dark" data-bs-toggle="dropdown">
           <span class="avatar me-2">${escapeHtml(initials(user.name))}</span>
           <span class="d-lg-none d-xl-inline fw-medium">${escapeHtml(user.name.split(' ')[0])}</span>
         </a>
         <ul class="dropdown-menu dropdown-menu-end shadow border-0">
           <li><span class="dropdown-item-text small text-muted">${escapeHtml(user.email)}</span></li>
           <li><hr class="dropdown-divider"></li>
           <li><a class="dropdown-item" href="dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
           <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
         </ul>
       </div>`
    : `<a href="login.html" class="btn btn-outline-primary me-2">Log in</a>
       <a href="register.html" class="btn btn-primary">Sign up</a>`;

  nav.innerHTML = `
    <nav class="navbar navbar-expand-lg ec-topbar sticky-top py-2">
      <div class="container ec-topbar__inner">
        <a class="navbar-brand ec-brand" href="${user ? 'dashboard.html' : 'index.html'}">
          <span class="ec-brand-icon"><svg class="tsvg" aria-hidden="true"><use href="#ec-tree-round"/></svg></span>EcoCommute
        </a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav mx-auto gap-lg-1">${links}</ul>
          <div class="d-flex align-items-center mt-3 mt-lg-0">${right}</div>
        </div>
      </div>
    </nav>`;

  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.clear();
    location.href = 'index.html';
  });
}

/* ---------- Footer ---------- */
function renderFooter() {
  const f = document.getElementById('footer');
  if (!f) return;
  f.innerHTML = `
    <footer class="ec-footer">
      <div class="treeline" aria-hidden="true"></div>
      <div class="ec-footer__body container d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
        <div><span class="ec-footer-brand"><svg class="tsvg" aria-hidden="true"><use href="#ec-tree-round"/></svg></span>
          <strong class="text-white">EcoCommute</strong> · Make every green trip count.</div>
        <div class="d-flex flex-wrap gap-2">
          <span class="sdg-pill sdg-pill--lime">SDG 11 · Sustainable Cities</span>
          <span class="sdg-pill sdg-pill--ghost">SDG 13 · Climate Action</span>
        </div>
        <div class="small">Made by Mehak &amp; Purva · ${new Date().getFullYear()}</div>
      </div>
    </footer>`;
}

/* ---------- Login guard for protected pages ---------- */
function requireLogin() {
  const user = Auth.getUser();
  if (!Auth.isLoggedIn() || !user) {
    location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop());
    throw new Error('Not logged in');
  }
  return user;
}

/* ---------- Toasts ---------- */
function toast(message, type = 'success') {
  let box = document.getElementById('toastBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toastBox';
    box.className = 'toast-container ec-toastbox position-fixed top-0 start-50 translate-middle-x p-3';
    document.body.appendChild(box);
  }
  const icons = { success: 'bi-check-circle-fill text-success', danger: 'bi-exclamation-octagon-fill text-danger',
                  warning: 'bi-exclamation-triangle-fill text-warning', info: 'bi-info-circle-fill text-primary' };
  const el = document.createElement('div');
  el.className = 'toast ec-toast align-items-center bg-white';
  el.setAttribute('data-type', icons[type] ? type : 'info');
  el.innerHTML = `<div class="d-flex align-items-center w-100">
      <span class="ec-toast-ico"><i class="bi ${icons[type] || icons.info}"></i></span>
      <div class="toast-body">${escapeHtml(message)}</div>
      <button type="button" class="btn-close me-3 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
  box.appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 3500 });
  t.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

/* ---------- Formatting helpers ---------- */
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function initials(name) {
  return String(name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}
const fmtNum = (n, dp = 0) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const fmtKg = (kg) => fmtNum(kg, kg >= 100 ? 1 : 2) + ' kg';
const fmtKm = (km) => fmtNum(km, 1) + ' km';

function fmtDate(dateStr, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', opts);
}
function monthName(yyyyMm, style = 'short') {
  const [y, m] = yyyyMm.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: style });
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function modeBadge(mode) {
  const m = MODES[mode];
  if (!m) return mode;
  return `<span class="mode-badge" style="background:${m.color}1f;color:${m.color}">
            <i class="bi ${m.icon}"></i>${m.label}</span>`;
}

/** Counts a number up from 0, for a lively dashboard */
function animateCounter(el, value, dp = 0, suffix = '') {
  const duration = 900, start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmtNum(value * eased, dp) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** Small celebration effect after logging a trip */
function confetti() {
  const colors = ['#16a34a', '#84cc16', '#0ea5e9', '#f59e0b', '#a855f7', '#facc15'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
    c.style.animationDelay = Math.random() * 0.4 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
}

const ECO_TIPS = [
  'Short trips under 2 km are perfect for walking. You also get your daily steps in!',
  'Cycling 10 km instead of driving saves about 1.2 kg of CO₂.',
  'A full bus can take up to 40 cars off the road.',
  'Carpooling with 3 friends cuts each person\'s emissions by 75%.',
  'Combine errands into one trip to reduce total distance travelled.',
  'Keep a consistent streak. Habits form in about 66 days!',
  'Check tyre pressure on your cycle weekly; it makes rides much easier.',
  'Metro and trains are among the lowest-emission ways to travel long distances in a city.'
];

/* ---------- Chart.js defaults ---------- */
if (window.Chart) {
  Chart.defaults.font.family = "'Poppins', system-ui, sans-serif";
  Chart.defaults.color = '#6b7280';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
}

renderNavbar();
renderFooter();
