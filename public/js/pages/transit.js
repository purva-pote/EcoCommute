// Transit schedules: pick a line and two stops, see the next departures, log the trip

const routeSelect = document.getElementById('routeSelect');
const fromSelect = document.getElementById('fromSelect');
const toSelect = document.getElementById('toSelect');
const timeInput = document.getElementById('timeInput');

let modes = {};            // all lines from /api/transit
let currentMode = 'train';
let liveMode = true;       // true = "leaving now", refreshes automatically

// Friendly defaults: the stations closest to campus
const DEFAULTS = {
  train: { route: 'central-slow', from: 'Vidyavihar', to: 'Dadar' },
  metro: { route: 'metro-1', from: 'Ghatkopar', to: 'Andheri' },
  bus: { route: 'bus-campus-a', from: 'Somaiya College Gate', to: 'Ghatkopar Station (W)' }
};

function nowClock() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// Remember the last trip the user looked at (per browser, optional)
function saveChoice() {
  try {
    localStorage.setItem('eco_transit', JSON.stringify({
      mode: currentMode, route: routeSelect.value, from: fromSelect.value, to: toSelect.value
    }));
  } catch { /* storage blocked: ignore */ }
}
function loadChoice() {
  try { return JSON.parse(localStorage.getItem('eco_transit')); } catch { return null; }
}

/* ---------- Building the dropdowns ---------- */
function renderTabs() {
  document.getElementById('modeTabs').innerHTML = Object.entries(modes).map(([key, m]) => `
    <li class="nav-item"><button class="nav-link ${key === currentMode ? 'active' : ''}" data-mode="${key}" type="button">
      <i class="bi ${m.icon} me-1"></i>${m.label}</button></li>`).join('');
}

function fillRoutes(preferredRoute) {
  const routes = modes[currentMode].routes;
  routeSelect.innerHTML = routes.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
  if (routes.some(r => r.id === preferredRoute)) routeSelect.value = preferredRoute;
}

function currentRoute() {
  return modes[currentMode].routes.find(r => r.id === routeSelect.value);
}

function fillStops(from, to) {
  const stops = currentRoute().stops;
  const opts = stops.map(s => `<option>${escapeHtml(s)}</option>`).join('');
  fromSelect.innerHTML = opts;
  toSelect.innerHTML = opts;
  fromSelect.value = stops.includes(from) ? from : stops[0];
  toSelect.value = stops.includes(to) && to !== fromSelect.value ? to : stops[stops.length - 1];
  if (toSelect.value === fromSelect.value) toSelect.value = stops[0];
}

function selectMode(mode, saved) {
  currentMode = mode;
  const pick = saved && saved.mode === mode ? saved : DEFAULTS[mode];
  renderTabs();
  fillRoutes(pick.route);
  fillStops(pick.from, pick.to);
  loadDepartures();
}

/* ---------- Fetch and show departures ---------- */
async function loadDepartures() {
  if (fromSelect.value === toSelect.value) {
    document.getElementById('depList').innerHTML =
      '<div class="empty-state"><div class="emoji">🤔</div>Pick two different stops.</div>';
    return;
  }
  saveChoice();
  if (liveMode) timeInput.value = nowClock();

  const q = new URLSearchParams({ route: routeSelect.value, from: fromSelect.value, to: toSelect.value, time: timeInput.value, limit: 8 });
  try {
    const data = await api('/api/transit/departures?' + q);
    render(data);
  } catch (e) {
    toast(e.message, 'danger');
  }
}

function waitLabel(min) {
  if (min <= 0) return { text: 'Leaving now!', soon: true };
  if (min <= 5) return { text: `in ${min} min, hurry!`, soon: true };
  if (min < 60) return { text: `in ${min} min`, soon: false };
  const h = Math.floor(min / 60), m = min % 60;
  return { text: `in ${h} h ${m ? m + ' min' : ''}`.trim(), soon: false };
}

function render(d) {
  const color = d.route.color;
  document.getElementById('routeBadge').innerHTML =
    `<span class="route-pill" style="background:${color}">${escapeHtml(d.route.short)}</span>
     <span class="small text-muted ms-1">${escapeHtml(d.route.name)} · ${escapeHtml(d.direction)}</span>`;
  document.getElementById('tripTitle').textContent = `${d.from} → ${d.to}`;
  document.getElementById('tripMeta').innerHTML =
    `<i class="bi bi-rulers me-1"></i>${fmtKm(d.distance)} · <i class="bi bi-clock me-1"></i>about ${d.travelMin} min · ${d.stopsCount} stop${d.stopsCount === 1 ? '' : 's'}`;
  document.getElementById('tripCo2').textContent = fmtKg(d.calc.co2SavedKg);
  document.getElementById('tripPts').textContent = '+' + d.calc.points + ' pts';

  // "Log this trip" opens the Log Trip page already filled in
  const logParams = new URLSearchParams({ mode: 'public', distance: d.distance, note: `${d.from} → ${d.to} (${d.route.short})` });
  document.getElementById('logTripBtn').href = 'log-trip.html?' + logParams;

  const list = document.getElementById('depList');
  if (!d.departures.length) {
    list.innerHTML = `<div class="empty-state"><div class="emoji">🌙</div>
      That's it for today. The first ${modes[currentMode].label.toLowerCase()} tomorrow leaves ${escapeHtml(d.from)} at <strong>${d.firstDeparture}</strong>.</div>`;
  } else {
    list.innerHTML = d.departures.map((dep, i) => {
      const w = waitLabel(dep.waitMin);
      return `
      <div class="dep-row ${i === 0 ? 'next' : ''}" style="--line-color:${color}">
        <div class="dep-time">${dep.depart}</div>
        <div class="dep-line"><span class="dep-mid">${d.travelMin} min</span></div>
        <div class="dep-time text-end">${dep.arrive}</div>
        <div style="min-width:120px" class="text-end">
          <span class="countdown ${w.soon ? 'soon' : ''}">${w.text}</span>
          ${i === 0 ? '<div class="small text-muted mt-1">next one</div>' : ''}
        </div>
      </div>`;
    }).join('');
  }

  document.getElementById('serviceInfo').innerHTML = `
    <span><i class="bi bi-sunrise me-1"></i>First from ${escapeHtml(d.from)}: <strong>${d.firstDeparture}</strong></span>
    <span><i class="bi bi-moon-stars me-1"></i>Last: <strong>${d.lastDeparture}</strong></span>
    <span><i class="bi bi-building me-1"></i>${escapeHtml(d.route.operator)}</span>`;

  // Stop list: highlight the stops on this trip
  const all = currentRoute().stops;
  const onTrip = new Set(d.tripStops);
  const stopList = document.getElementById('stopList');
  stopList.style.setProperty('--line-color', color);
  stopList.innerHTML = all.map(s => {
    const cls = s === d.from || s === d.to ? 'on-trip' : onTrip.has(s) ? '' : 'dim';
    const tag = s === d.from ? ' <span class="badge text-bg-light">board</span>' : s === d.to ? ' <span class="badge text-bg-light">get off</span>' : '';
    return `<li class="${cls}">${escapeHtml(s)}${tag}</li>`;
  }).join('');
}

/* ---------- Events ---------- */
document.getElementById('modeTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-mode]');
  if (btn && btn.dataset.mode !== currentMode) selectMode(btn.dataset.mode);
});
routeSelect.addEventListener('change', () => {
  const r = currentRoute();
  fillStops(r.stops[0], r.stops[r.stops.length - 1]);
  loadDepartures();
});
[fromSelect, toSelect].forEach(el => el.addEventListener('change', loadDepartures));
document.getElementById('swapBtn').addEventListener('click', () => {
  [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
  loadDepartures();
});
timeInput.addEventListener('change', () => {
  liveMode = timeInput.value === nowClock();
  document.getElementById('liveHint').classList.toggle('invisible', !liveMode);
  loadDepartures();
});
document.getElementById('nowBtn').addEventListener('click', () => {
  liveMode = true;
  document.getElementById('liveHint').classList.remove('invisible');
  loadDepartures();
});

// Live countdowns: refresh every minute while "leaving now" is on
setInterval(() => { if (liveMode && !document.hidden) loadDepartures(); }, 60000);

/* ---------- Start ---------- */
(async function init() {
  try {
    const data = await api('/api/transit');
    modes = data.modes;
    const saved = loadChoice();
    selectMode(saved && modes[saved.mode] ? saved.mode : 'train', saved);
  } catch (e) {
    toast(e.message, 'danger');
  }
})();
