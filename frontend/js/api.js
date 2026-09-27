// ─── API Configuration ────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';

// ─── API Helper ───────────────────────────────────────────────
async function api(path, options = {}) {
  const defaults = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  };
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...defaults, ...options });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: 'Network error. Is the server running?' } };
  }
}

// ─── Auth State ───────────────────────────────────────────────
let currentUser = null;

async function fetchCurrentUser() {
  const { ok, data } = await api('/auth/me');
  currentUser = ok ? data.data : null;
  updateNavAuth();
  return currentUser;
}

function updateNavAuth() {
  const loginBtn   = document.getElementById('nav-login-btn');
  const registerBtn= document.getElementById('nav-register-btn');
  const userMenu   = document.getElementById('nav-user-menu');
  const userAvatar = document.getElementById('nav-user-avatar');

  if (currentUser) {
    loginBtn?.classList.add('hidden');
    registerBtn?.classList.add('hidden');
    userMenu?.classList.remove('hidden');
    if (userAvatar) {
      userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }
  } else {
    loginBtn?.classList.remove('hidden');
    registerBtn?.classList.remove('hidden');
    userMenu?.classList.add('hidden');
  }
}

// ─── Toast Notifications ─────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Render Stars ─────────────────────────────────────────────
function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ─── Format Date ──────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Get Doctor Avatar Initials ───────────────────────────────
function getDoctorInitials(name) {
  return name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Navigation Active Link ───────────────────────────────────
function setActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.includes(page) || (page === 'index.html' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ─── Navbar Scroll Effect ─────────────────────────────────────
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ─── Hamburger Menu ───────────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });
}

// ─── Modal Helpers ────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('hidden'); document.body.style.overflow = ''; }
}
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.add('hidden');
  });
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) closeAllModals();
});

// ─── Auth Modal Logic ─────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-submit-btn');

  btn.textContent = 'Signing in...';
  btn.disabled = true;

  const { ok, data } = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  btn.textContent = 'Sign In';
  btn.disabled = false;

  if (ok) {
    currentUser = data.data;
    updateNavAuth();
    closeModal('login-modal');
    showToast(`Welcome back, ${currentUser.name}! 👋`, 'success');
    setTimeout(() => location.reload(), 800);
  } else {
    showToast(data.error || 'Login failed', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const phone    = document.getElementById('reg-phone').value.trim();
  const btn      = document.getElementById('register-submit-btn');

  if (password.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }

  btn.textContent = 'Creating account...';
  btn.disabled = true;

  const { ok, data } = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone })
  });

  btn.textContent = 'Create Account';
  btn.disabled = false;

  if (ok) {
    currentUser = data.data;
    updateNavAuth();
    closeModal('register-modal');
    showToast(`Welcome to MediCare, ${currentUser.name}! 🎉`, 'success');
    setTimeout(() => location.reload(), 800);
  } else {
    showToast(data.error || 'Registration failed', 'error');
  }
}

async function handleLogout() {
  await api('/auth/logout', { method: 'POST' });
  currentUser = null;
  updateNavAuth();
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = 'index.html', 800);
}

// ─── Intersection Observer Animations ────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ─── Global Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await fetchCurrentUser();
  setActiveNavLink();
  initNavbarScroll();
  initHamburger();
  initScrollAnimations();

  // Auth form handlers
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('register-form')?.addEventListener('submit', handleRegister);
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  // Switch modals
  document.getElementById('switch-to-register')?.addEventListener('click', () => {
    closeModal('login-modal'); openModal('register-modal');
  });
  document.getElementById('switch-to-login')?.addEventListener('click', () => {
    closeModal('register-modal'); openModal('login-modal');
  });
});
