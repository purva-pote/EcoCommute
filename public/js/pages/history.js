// Trip history: filter, search, paginate, delete, export CSV
requireLogin();

const PAGE_SIZE = 15;
let allTrips = [];      // everything from the server
let filtered = [];      // after filters
let page = 1;
let pendingDeleteId = null;

const fMode = document.getElementById('fMode');
const fMonth = document.getElementById('fMonth');
const fSearch = document.getElementById('fSearch');
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

fMode.innerHTML += Object.entries(MODES).map(([k, m]) => `<option value="${k}">${m.emoji} ${m.label}</option>`).join('');

async function loadTrips() {
  try {
    const { trips } = await api('/api/trips');
    allTrips = trips;
    // Month dropdown built from the months the user actually has trips in
    const months = [...new Set(trips.map(t => t.date.slice(0, 7)))];
    fMonth.innerHTML = '<option value="">All months</option>' +
      months.map(m => `<option value="${m}">${monthName(m, 'long')} ${m.slice(0, 4)}</option>`).join('');
    applyFilters();
  } catch (e) {
    toast(e.message, 'danger');
  }
}

function applyFilters() {
  const mode = fMode.value, month = fMonth.value, q = fSearch.value.trim().toLowerCase();
  filtered = allTrips.filter(t =>
    (!mode || t.mode === mode) &&
    (!month || t.date.startsWith(month)) &&
    (!q || (t.note || '').toLowerCase().includes(q))
  );
  page = 1;
  renderSummary();
  renderTable();
}

function renderSummary() {
  const sum = (key) => filtered.reduce((s, t) => s + t[key], 0);
  document.getElementById('sTrips').textContent = fmtNum(filtered.length);
  document.getElementById('sKm').textContent = fmtKm(sum('distance'));
  document.getElementById('sCo2').textContent = fmtKg(sum('co2_saved'));
  document.getElementById('sPts').textContent = fmtNum(sum('points'));
}

function renderTable() {
  const body = document.getElementById('tripBody');
  const pager = document.getElementById('pager');

  if (!filtered.length) {
    body.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="emoji">🔍</div>
      ${allTrips.length ? 'No trips match your filters.' : 'No trips yet. <a href="log-trip.html">Log your first one!</a>'}
      </div></td></tr>`;
    pager.innerHTML = '';
    return;
  }

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  body.innerHTML = rows.map(t => `
    <tr>
      <td class="text-nowrap">${fmtDate(t.date)}</td>
      <td>${modeBadge(t.mode)}</td>
      <td>${fmtKm(t.distance)}</td>
      <td>${t.mode === 'carpool' ? t.passengers : '–'}</td>
      <td class="text-success fw-semibold">${fmtKg(t.co2_saved)}</td>
      <td><span class="badge text-bg-light">+${t.points}</span></td>
      <td class="text-muted small">${escapeHtml(t.note || '')}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-light text-danger" data-delete="${t.id}" title="Delete trip"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');

  pager.innerHTML = `
    <span>Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}</span>
    <div class="btn-group">
      <button class="btn btn-sm btn-outline-secondary" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>
      <button class="btn btn-sm btn-outline-secondary" disabled>${page} / ${pages}</button>
      <button class="btn btn-sm btn-outline-secondary" data-page="${page + 1}" ${page === pages ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>
    </div>`;
}

/* ---------- Events ---------- */
[fMode, fMonth].forEach(el => el.addEventListener('change', applyFilters));
fSearch.addEventListener('input', applyFilters);
document.getElementById('fReset').addEventListener('click', () => {
  fMode.value = fMonth.value = fSearch.value = '';
  applyFilters();
});

document.getElementById('pager').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (!btn) return;
  page = Number(btn.dataset.page);
  renderTable();
});

document.getElementById('tripBody').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-delete]');
  if (!btn) return;
  pendingDeleteId = Number(btn.dataset.delete);
  const t = allTrips.find(x => x.id === pendingDeleteId);
  document.getElementById('deleteText').textContent =
    `${MODES[t.mode].label}, ${t.distance} km on ${fmtDate(t.date)}. This will remove ${t.co2_saved} kg CO₂ and ${t.points} points from your totals.`;
  deleteModal.show();
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
  try {
    await api('/api/trips/' + pendingDeleteId, { method: 'DELETE' });
    allTrips = allTrips.filter(t => t.id !== pendingDeleteId);
    deleteModal.hide();
    toast('Trip deleted');
    const keepPage = page;
    applyFilters();
    page = Math.min(keepPage, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
    renderTable();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

// Export the currently filtered trips as a CSV file
document.getElementById('exportBtn').addEventListener('click', () => {
  if (!filtered.length) return toast('Nothing to export', 'warning');
  const header = ['Date', 'Mode', 'Distance (km)', 'People', 'CO2 saved (kg)', 'Points', 'Note'];
  const lines = filtered.map(t => [t.date, MODES[t.mode].label, t.distance, t.passengers, t.co2_saved, t.points,
    '"' + (t.note || '').replace(/"/g, '""') + '"'].join(','));
  const blob = new Blob([header.join(',') + '\n' + lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ecocommute-trips.csv';
  a.click();
  URL.revokeObjectURL(a.href);
});

loadTrips();
