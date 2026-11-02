// Admin sign-in page
const params = new URLSearchParams(location.search);
const errorBox = document.getElementById('formError');
const submitBtn = document.getElementById('submitBtn');
const form = document.getElementById('adminLoginForm');

const currentUser = Auth.getUser();
if (Auth.isLoggedIn() && currentUser && currentUser.role === 'admin') {
  location.href = 'admin.html';
}

if (params.get('expired')) document.getElementById('expiredMsg').classList.remove('d-none');

function showError(message) {
  errorBox.innerHTML = '<i class="bi bi-exclamation-circle me-1"></i>' + escapeHtml(message);
  errorBox.classList.remove('d-none');
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.querySelector('.spinner-border').classList.toggle('d-none', !on);
}

document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = `<i class="bi ${show ? 'bi-eye-slash' : 'bi-eye'}"></i>`;
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.add('d-none');
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  setLoading(true);
  try {
    const res = await fetch(API_BASE + '/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.error || 'Sign in failed.');

    if (!data.user || data.user.role !== 'admin') {
      Auth.clear();
      throw new Error('This account does not have admin access.');
    }

    Auth.save(data.token, data.user);
    location.href = 'admin.html';
  } catch (err) {
    showError(err.message);
    setLoading(false);
  }
});
