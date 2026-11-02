// Admin users: search, change role, delete, pagination
const PAGE_SIZE = 15;
const me = Auth.getUser();
let page = 1;
let users = [];
let pendingDelete = null;
let requestId = 0;

const fSearch = document.getElementById('fSearch');
const body = document.getElementById('userBody');
const pager = document.getElementById('pager');
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

async function loadUsers() {
  const thisRequest = ++requestId;
  const params = new URLSearchParams({ page });
  if (fSearch.value.trim()) params.set('search', fSearch.value.trim());

  try {
    const data = await adminFetch('/api/admin/users?' + params);
    if (thisRequest !== requestId) return;          // a newer search already started
    if (data.page > data.pages) { page = data.pages; return loadUsers(); }
    users = data.users;
    renderTable(data);
  } catch (e) {
    if (thisRequest === requestId) toast(e.message, 'danger');
  }
}

function renderTable({ pages, total }) {
  if (!users.length) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="emoji">🔍</div>No users match your search.</div></td></tr>`;
    pager.innerHTML = '';
    return;
  }

  body.innerHTML = users.map(u => {
    const isMe = u.id === me.id;
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    return `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          <span class="avatar me-2">${escapeHtml(initials(u.name))}</span>
          <div>
            <div class="fw-bold">${escapeHtml(u.name)}${isMe ? ' <span class="badge text-bg-light">You</span>' : ''}</div>
            <div class="small text-muted">${escapeHtml(u.email)}</div>
          </div>
        </div>
      </td>
      <td><span class="role-badge ${u.role}">${u.role}</span></td>
      <td>${fmtNum(u.trips)}</td>
      <td class="text-success fw-semibold">${fmtKg(u.co2_saved)}</td>
      <td class="text-nowrap">${fmtDate(u.created_at.slice(0, 10))}</td>
      <td class="admin-actions-cell">
        <a class="btn btn-sm btn-light" href="admin-trips.html?userId=${u.id}" title="View trips"><i class="bi bi-geo-alt"></i></a>
        <button class="btn btn-sm btn-light" data-role="${u.id}" data-next="${nextRole}" ${isMe ? 'disabled' : ''}
          title="Make ${nextRole}"><i class="bi ${u.role === 'admin' ? 'bi-shield-minus' : 'bi-shield-plus'}"></i></button>
        <button class="btn btn-sm btn-light text-danger" data-delete="${u.id}" ${isMe ? 'disabled' : ''}
          title="Delete user"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join('');

  renderPager(pager, { page, pages, total, pageSize: PAGE_SIZE });
}

/* ---------- Events ---------- */
fSearch.addEventListener('input', debounce(() => { page = 1; loadUsers(); }));
document.getElementById('fReset').addEventListener('click', () => {
  fSearch.value = '';
  page = 1;
  loadUsers();
});

pager.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (!btn) return;
  page = Number(btn.dataset.page);
  loadUsers();
});

body.addEventListener('click', async (e) => {
  const roleBtn = e.target.closest('[data-role]');
  if (roleBtn) {
    try {
      await adminFetch(`/api/admin/users/${roleBtn.dataset.role}/role`, { method: 'PATCH', body: { role: roleBtn.dataset.next } });
      toast('Role updated to ' + roleBtn.dataset.next);
      loadUsers();
    } catch (err) {
      toast(err.message, 'danger');
    }
    return;
  }

  const delBtn = e.target.closest('[data-delete]');
  if (delBtn) {
    pendingDelete = users.find(u => u.id === Number(delBtn.dataset.delete));
    document.getElementById('deleteText').textContent =
      `${pendingDelete.name} (${pendingDelete.email}) and their ${pendingDelete.trips} trip(s) will be removed permanently.`;
    deleteModal.show();
  }
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
  try {
    await adminFetch('/api/admin/users/' + pendingDelete.id, { method: 'DELETE' });
    deleteModal.hide();
    toast('User deleted');
    loadUsers();
  } catch (err) {
    deleteModal.hide();
    toast(err.message, 'danger');
  }
});

loadUsers();
