// ============ PARTICLE BG ============
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  particles = Array.from({ length: Math.min(85, Math.floor(innerWidth / 14)) }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.3 + .3,
    alpha: Math.random() * .5 + .08,
    speed: Math.random() * .22 + .04
  }));
}

function drawParticles() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of particles) {
    p.y -= p.speed;
    if (p.y < 0) { p.y = innerHeight; p.x = Math.random() * innerWidth; }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(193,174,255,${p.alpha})`;
    ctx.fill();
  }
  requestAnimationFrame(drawParticles);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
drawParticles();

// ============ AUTH ============
const USERS_KEY = 'am_vault_users';
const SESSION_KEY = 'am_vault_session';
const CLAIMS_KEY = 'am_vault_claims';

function hashPass(p) { return btoa(p + '_am_salt_2026'); }

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function getSession() { return localStorage.getItem(SESSION_KEY); }
function setSession(u) { localStorage.setItem(SESSION_KEY, u); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }
function getClaims() {
  try { return JSON.parse(localStorage.getItem(CLAIMS_KEY)) || {}; }
  catch { return {}; }
}
function saveClaims(c) { localStorage.setItem(CLAIMS_KEY, JSON.stringify(c)); }

// ============ DATA AKUN ============
let accountData = { plus: [], regular: [] };

async function loadAccountData() {
  try {
    const r = await fetch('./akunplus.json');
    if (r.ok) {
      const d = await r.json();
      accountData.plus = Array.isArray(d) ? d : (d.accounts || []);
    }
  } catch (e) { console.warn('akunplus gagal:', e); }

  try {
    const r = await fetch('./akunregular.json');
    if (r.ok) {
      const d = await r.json();
      accountData.regular = Array.isArray(d) ? d : (d.accounts || []);
    }
  } catch (e) { console.warn('akunregular gagal:', e); }
}

function getAccountsByType(t) { return accountData[t] || []; }
function getTotalAvailable() { return accountData.plus.length + accountData.regular.length; }

// ============ TOAST ============
let toastTimer;
function notify(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ============ UI ============
const loginFields = document.getElementById('loginFields');
const registerFields = document.getElementById('registerFields');
const modeBadge = document.getElementById('modeBadge');

console.log('Script loaded ✅');

document.getElementById('showRegister').addEventListener('click', () => {
  console.log('Klik DAFTAR');
  loginFields.classList.add('hidden');
  registerFields.classList.remove('hidden');
  modeBadge.textContent = '✦ REGISTER';
  document.getElementById('regUsername').value = '';
  document.getElementById('regPassword').value = '';
  document.getElementById('regPassword2').value = '';
  setTimeout(() => document.getElementById('regUsername').focus(), 100);
});

document.getElementById('backToLogin').addEventListener('click', () => {
  console.log('Klik KEMBALI');
  registerFields.classList.add('hidden');
  loginFields.classList.remove('hidden');
  modeBadge.textContent = '✦ LOGIN';
});

document.getElementById('togglePass').addEventListener('click', () => {
  const p = document.getElementById('password');
  p.type = p.type === 'password' ? 'text' : 'password';
});

// ============ LOGIN ============
