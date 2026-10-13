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
document.getElementById('doLogin').addEventListener('click', () => {
  console.log('Klik LOGIN');
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;

  if (!u || !p) { notify('⚠️ Isi username dan password!'); return; }

  const users = getUsers();
  if (!users[u]) { notify('❌ Username tidak ditemukan!'); return; }
  if (users[u].pass !== hashPass(p)) { notify('❌ Password salah!'); return; }

  console.log('✅ Login sukses');
  setSession(u);
  showDashboard(u);
  notify('✅ Selamat datang, ' + u + '!');
});

// ============ REGISTER ============
document.getElementById('doRegister').addEventListener('click', () => {
  console.log('Klik DAFTAR');
  const u = document.getElementById('regUsername').value.trim();
  const p1 = document.getElementById('regPassword').value;
  const p2 = document.getElementById('regPassword2').value;

  if (!u || !p1 || !p2) { notify('⚠️ Isi semua field!'); return; }
  if (u.length < 3) { notify('⚠️ Username minimal 3 karakter!'); return; }
  if (p1.length < 4) { notify('⚠️ Password minimal 4 karakter!'); return; }
  if (p1 !== p2) { notify('❌ Password tidak sama!'); return; }

  const users = getUsers();
  if (users[u]) { notify('❌ Username sudah dipakai!'); return; }

  users[u] = { pass: hashPass(p1), created: Date.now() };
  saveUsers(users);
  console.log('✅ Register sukses:', u);

  notify('✅ Akun dibuat! Login dulu.');

  document.getElementById('regUsername').value = '';
  document.getElementById('regPassword').value = '';
  document.getElementById('regPassword2').value = '';
  document.getElementById('username').value = u;
  document.getElementById('password').value = '';

  registerFields.classList.add('hidden');
  loginFields.classList.remove('hidden');
  modeBadge.textContent = '✦ LOGIN';
  document.getElementById('password').focus();
});

// ============ DASHBOARD ============
const grid = document.getElementById('accountGrid');
const searchInput = document.getElementById('search');
let activeFilter = 'all';
let currentUser = null;

function showDashboard(username) {
  currentUser = username;
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('dashboard').classList.add('active');
  document.getElementById('welcomeUser').textContent = username;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderAccounts();
  updateStats();
}

function updateStats() {
  document.getElementById('totalCount').textContent = String(getTotalAvailable()).padStart(2, '0');
  const claims = getClaims();
  const my = claims[currentUser] || {};
  let count = 0;
  for (const k in my) if (Array.isArray(my[k])) count += my[k].length;
  document.getElementById('myClaims').textContent = String(count).padStart(2, '0');
}

function renderAccounts() {
  const query = searchInput.value.toLowerCase().trim();
  const categories = [
    { id: 'plus', name: 'AM Plus', desc: 'Premium account collection', icon: '✦', type: 'plus', quantity: accountData.plus.length },
    { id: 'regular', name: 'Regular', desc: 'Regular account collection', icon: '◈', type: 'regular', quantity: accountData.regular.length }
  ];

  const claims = getClaims();
  const myClaims = claims[currentUser] || {};

  const filtered = categories.filter(cat => {
    const isClaimed = myClaims[cat.id] && myClaims[cat.id].length > 0;
    const matchFilter =
      activeFilter === 'all' ||
      (activeFilter === 'available' && !isClaimed) ||
      (activeFilter === 'claimed' && isClaimed);
    const matchSearch = (cat.name + ' ' + cat.desc).toLowerCase().includes(query);
    return matchFilter && matchSearch;
  });

  grid.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.gridColumn = '1/-1';
    empty.textContent = 'Kategori tidak ditemukan.';
    grid.appendChild(empty);
    return;
  }

  for (const cat of filtered) {
    const catClaims = myClaims[cat.id] || [];
    const isClaimed = catClaims.length > 0;

    const card = document.createElement('article');
    card.className = `account ${cat.type}`;

    const top = document.createElement('div');
    top.className = 'account-top';
    const icon = document.createElement('div');
    icon.className = 'account-icon';
    icon.textContent = cat.icon;
    const status = document.createElement('span');
    status.className = 'status';
    status.textContent = isClaimed ? `✓ ${catClaims.length} CLAIMED` : '● AVAILABLE';
    top.append(icon, status);

    const title = document.createElement('h3');
    title.textContent = cat.name;
    const desc = document.createElement('p');
    desc.textContent = cat.desc;

    const count = document.createElement('div');
    count.className = 'countbox';
    const lbl = document.createElement('span');
    lbl.textContent = 'Akun tersedia';
    const val = document.createElement('strong');
    val.textContent = cat.quantity;
    count.append(lbl, val);

    const btn = document.createElement('button');
    btn.className = 'claim';
    btn.dataset.id = cat.id;
    btn.textContent = isClaimed ? `LIHAT ${catClaims.length} AKUN SAYA ↗` : 'BUKA KATEGORI ↗';

    card.append(top, title, desc, count, btn);
    grid.appendChild(card);
  }
}

grid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-id]');
  if (!btn) return;
  openCategory(btn.dataset.id);
});

// ============ MODAL ============
const modal = document.getElementById('accountModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

function openCategory(type) {
  const catName = type === 'plus' ? 'AM Plus' : 'Regular';
  const accounts = getAccountsByType(type);
  const claims = getClaims();
  const myClaims = (claims[currentUser] || {})[type] || [];

  modalTitle.textContent = catName + ' — ' + accounts.length + ' akun';

  if (accounts.length === 0) {
    modalBody.innerHTML = `
      <div class="empty-state">
        <p style="font-size: 40px; margin-bottom: 14px;">📭</p>
        <p><strong>Belum ada akun di kategori ini.</strong></p>
      </div>
    `;
    modal.classList.add('active');
    return;
  }

  modalBody.innerHTML = '<div class="account-list" id="accountList"></div>';
  const list = document.getElementById('accountList');

  accounts.forEach((acc, i) => {
    const isClaimed = myClaims.includes(i);
    const email = acc.email || acc.user || acc.username || '(tanpa email)';
    const pass = acc.pass || acc.password || acc.pw || '(tanpa password)';

    const item = document.createElement('div');
    item.className = 'account-item';
    item.style.opacity = isClaimed ? '0.6' : '1';
    item.innerHTML = `
      <div class="email">${isClaimed ? '✓ ' : ''}${escapeHtml(email)}</div>
      <div class="pass">${isClaimed ? '•'.repeat(Math.min(pass.length, 20)) : '••••••••'}</div>
      <div class="actions">
        <button class="btn-copy-email" data-email="${escapeAttr(email)}">📋 Copy Email</button>
        <button class="btn-copy-pass" data-pass="${escapeAttr(pass)}" ${isClaimed ? '' : 'disabled'}>
          🔑 ${isClaimed ? 'Copy Password' : 'Klaim Dulu'}
        </button>
        ${isClaimed ? '' : `<button class="btn-claim" data-index="${i}">✓ Klaim</button>`}
      </div>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('.btn-copy-email').forEach(b => {
    b.addEventListener('click', () => {
      copyToClipboard(b.dataset.email);
      notify('📋 Email di-copy!');
    });
  });
  list.querySelectorAll('.btn-copy-pass').forEach(b => {
    b.addEventListener('click', () => {
      if (b.disabled) return;
      copyToClipboard(b.dataset.pass);
      notify('🔑 Password di-copy!');
    });
  });
  list.querySelectorAll('.btn-claim').forEach(b => {
    b.addEventListener('click', () => {
      claimAccount(type, parseInt(b.dataset.index));
    });
  });

  modal.classList.add('active');
}

function claimAccount(type, index) {
  if (!currentUser) return;
  const claims = getClaims();
  if (!claims[currentUser]) claims[currentUser] = {};
  if (!claims[currentUser][type]) claims[currentUser][type] = [];
  if (claims[currentUser][type].includes(index)) {
    notify('⚠️ Sudah kamu klaim!');
    return;
  }
  claims[currentUser][type].push(index);
  saveClaims(claims);
  notify('✅ Akun diklaim!');
  openCategory(type);
  renderAccounts();
  updateStats();
}

document.getElementById('modalClose').addEventListener('click', () => {
  modal.classList.remove('active');
});
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('active');
});

// ============ HELPERS ============
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else fallbackCopy(text);
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

// ============ SEARCH & FILTER ============
searchInput.addEventListener('input', renderAccounts);
document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === btn));
    renderAccounts();
  });
});

// ============ LOGOUT ============
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (!confirm('Yakin mau logout?')) return;
  clearSession();
  currentUser = null;
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('dashboard').classList.remove('active');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  notify('👋 Logout berhasil');
});

// ============ AUTO LOGIN ============
window.addEventListener('load', async () => {
  await loadAccountData();
  const session = getSession();
  if (session && getUsers()[session]) {
    showDashboard(session);
  }
});
