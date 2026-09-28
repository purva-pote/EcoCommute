// Login + Register pages (both use this file)

const params = new URLSearchParams(location.search);
const nextPage = params.get('next') && /^[\w-]+\.html$/.test(params.get('next')) ? params.get('next') : 'dashboard.html';

// Already logged in? Skip straight to the dashboard
if (Auth.isLoggedIn()) location.href = nextPage;

const errorBox = document.getElementById('formError');
const submitBtn = document.getElementById('submitBtn');

function showError(msg) {
  errorBox.innerHTML = '<i class="bi bi-exclamation-circle me-1"></i>' + escapeHtml(msg);
  errorBox.classList.remove('d-none');
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.querySelector('.spinner-border').classList.toggle('d-none', !on);
}

async function authenticate(path, body) {
  errorBox.classList.add('d-none');
  setLoading(true);
  try {
    const { token, user } = await api(path, { method: 'POST', body });
    Auth.save(token, user);
    location.href = nextPage;
  } catch (e) {
    showError(e.message);
    setLoading(false);
  }
}

// Show / hide password buttons
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = `<i class="bi ${show ? 'bi-eye-slash' : 'bi-eye'}"></i>`;
  });
});

/* ---------- Login ---------- */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  if (params.get('expired')) document.getElementById('expiredMsg').classList.remove('d-none');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginForm.classList.add('was-validated');
    if (!loginForm.checkValidity()) return;
    authenticate('/api/auth/login', {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    });
  });

  // Demo account for the presentation (created by server/seed.js)
  document.getElementById('demoBtn').addEventListener('click', () => {
    document.getElementById('email').value = 'demo@ecocommute.test';
    document.getElementById('password').value = 'demo1234';
    authenticate('/api/auth/login', { email: 'demo@ecocommute.test', password: 'demo1234' });
  });
}

/* ---------- Register ---------- */
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const pw = document.getElementById('password');
  const confirm = document.getElementById('confirm');
  const checkMatch = () => confirm.setCustomValidity(confirm.value && confirm.value !== pw.value ? 'mismatch' : '');
  pw.addEventListener('input', checkMatch);
  confirm.addEventListener('input', checkMatch);

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    checkMatch();
    if (!confirm.value) confirm.setCustomValidity('required');
    registerForm.classList.add('was-validated');
    if (!registerForm.checkValidity()) return;
    authenticate('/api/auth/register', {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: pw.value
    });
  });
}
