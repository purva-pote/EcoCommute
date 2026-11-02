// Admin trips: filter by mode and user, delete, pagination
const PAGE_SIZE = 15;
let page = 1;
let trips = [];
let pendingDelete = null;
let requestId = 0;

const fMode = document.getElementById('fMode');
const fUser = document.getElementById('fUser');
const body = document.getElementById('tripBody');
const pager = document.getElementById('pager');
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

fMode.innerHTML += Object.entries(MODES).map(([k, m]) => `<option value="${k}">${m.emoji} ${m.label}</option>`).join('');

// Arriving from the Users page: admin-trips.html?userId=3
const urlUser = new URLSearchParams(location.search).get('userId');
if (urlUser && Number(urlUser) >= 1) fUser.value = Number(urlUser);

async function loadTrips() {
  const thisRequest = ++requestId;
  const params = new URLSearchParams({ page });
  if (fMode.value) params.set('mode', fMode.value);
  if (Number(fUser.value) >= 1) params.set('userId', Math.floor(Number(fUser.value)));

  try {
    const data = await adminFetch('/api/admin/trips?' + params);
    if (thisRequest !== requestId) return;
    if (data.page > data.pages) { page = data.pages; return loadTrips(); }
    trips = data.trips;
    renderTable(data);
  } catch (e) {
    if (thisRequest === requestId) toast(e.message, 'danger');
  }
}

function renderTable({ pages, total }) {
  if (!trips.length) {
    body.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="emoji">🔍</div>No trips match your filters.</div></td></tr>`;
    pager.innerHTML = '';
    return;
  }

  body.innerHTML = trips.map(t => `
    <tr>
      <td class="text-nowrap">${fmtDate(t.date)}</td>
      <td>
        <div class="fw-bold">${escapeHtml(t.user_name)}</div>
        <div class="small text-muted">#${t.user_id} · ${escapeHtml(t.user_email)}</div>
      </td>
      <td>${modeBadge(t.mode)}</td>
      <td>${fmtKm(t.distance)}</td>
      <td>${t.mode === 'carpool' ? t.passengers : '-'}</td>
      <td class="text-success fw-semibold">${fmtKg(t.co2_saved)}</td>
      <td><span class="badge text-bg-light">+${t.points}</span></td>
      <td class="text-muted small"><div class="admin-note" title="${escapeHtml(t.note || '')}">${escapeHtml(t.note || '')}</div></td>
      <td class="text-end">
        <button class="btn btn-sm btn-light text-danger" data-delete="${t.id}" title="Delete trip"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');

  renderPager(pager, { page, pages, total, pageSize: PAGE_SIZE });
}

/* ---------- Events ---------- */
fMode.addEventListener('change', () => { page = 1; loadTrips(); });
fUser.addEventListener('input', debounce(() => { page = 1; loadTrips(); }));
document.getElementById('fReset').addEventListener('click', () => {
  fMode.value = fUser.value = '';
  page = 1;
  loadTrips();
});

pager.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (!btn) return;
  page = Number(btn.dataset.page);
  loadTrips();
});

body.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-delete]');
  if (!btn) return;
  pendingDelete = trips.find(t => t.id === Number(btn.dataset.delete));
  document.getElementById('deleteText').textContent =
    `${MODES[pendingDelete.mode].label}, ${pendingDelete.distance} km by ${pendingDelete.user_name} on ${fmtDate(pendingDelete.date)}. ` +
    `This removes ${pendingDelete.co2_saved} kg CO₂ and ${pendingDelete.points} points from their totals.`;
  deleteModal.show();
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
  try {
    await adminFetch('/api/admin/trips/' + pendingDelete.id, { method: 'DELETE' });
    deleteModal.hide();
    toast('Trip deleted');
    loadTrips();
  } catch (err) {
    deleteModal.hide();
    toast(err.message, 'danger');
  }
});

loadTrips();
