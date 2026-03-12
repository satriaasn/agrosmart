/* =============================================
   AgroSmart — Main Application Core
   Router, Modal, Toast, Sidebar, Theme
   ============================================= */

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────
let currentPage = 'dashboard';
let sidebarCollapsed = false;
let currentModalSave = null;

// ─── Navigate ─────────────────────────────────────────────────────────────────
async function navigate(page) {
  currentPage = page;

  // Update nav active state (Sidebar)
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');

  // Update nav active state (Bottom Nav)
  document.querySelectorAll('.bnav-item').forEach(el => el.classList.remove('active'));
  const bnavEl = document.querySelector(`.bnav-item[data-page="${page}"]`);
  if (bnavEl) bnavEl.classList.add('active');

  // Update breadcrumb
  const labels = { dashboard:'Dashboard', tanaman:'Tanaman', lahan:'Lahan', karyawan:'Karyawan', panen:'Panen', keuangan:'Keuangan', laporan:'Laporan', cuaca:'Cuaca', peta:'Peta Lahan', tim:'Manajemen Tim', profil:'Profil & Pengaturan' };
  const bc = document.getElementById('breadcrumb');
  if (bc) bc.innerHTML = `<span style="color:var(--text-muted)">AgroSmart</span> <span style="color:var(--text-muted);margin:0 6px">/</span> <span>${labels[page] || page}</span>`;

  // Render page HTML
  const container = document.getElementById('pageContainer');
  if (!container) return;

  // ── Permission Guard untuk operator ──────────────────────────────
  const gatedPages = ['tanaman','lahan','karyawan','panen','keuangan','laporan','peta','cuaca','tim'];
  if (window.APP_ROLE === 'operator' && gatedPages.includes(page)) {
    if (!canAccess(page === 'tim' ? 'lahan' : page)) {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;gap:12px">
          <div style="font-size:48px">🔒</div>
          <div style="font-size:18px;font-weight:700;color:var(--text-primary)">Akses Ditolak</div>
          <div style="font-size:13px;color:var(--text-secondary)">Anda tidak memiliki izin untuk mengakses modul ini.<br>Hubungi pemilik akun untuk mengatur permission Anda.</div>
        </div>`;
      return;
    }
  }

  let html = '';
  try {
    // Show loading state
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;gap:16px">
        <div class="spinner" style="width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--accent-primary);border-radius:50%;animation:spin 1s linear infinite"></div>
        <div style="font-size:13px;color:var(--text-secondary);font-weight:600">Memuat data dari server...</div>
        <style>@keyframes spin { 100% { transform:rotate(360deg); } }</style>
      </div>`;

    switch (page) {
      case 'dashboard': html = await renderDashboard(); break;
      case 'tanaman':   html = await renderTanaman();   break;
      case 'lahan':     html = await renderLahan();     break;
      case 'karyawan':  html = await renderKaryawan();  break;
      case 'panen':     html = await renderPanen();     break;
      case 'keuangan':  html = await renderKeuangan();  break;
      case 'laporan':   html = await renderLaporan();   break;
      case 'cuaca':     html = await renderCuaca();     break;
      case 'peta':      html = await renderPeta();      break;
      case 'tim':       html = await renderTim();       break;
      case 'profil':    html = await renderProfil();    break;
      default:          html = `<div class="page-header"><div class="page-title">404</div></div><p>Halaman tidak ditemukan.</p>`;
    }
  } catch (err) {
    console.error('Render error:', err);
    html = `<div class="alert alert-danger">Error memuat halaman: ${err.message}</div>`;
  }

  container.innerHTML = html;
  container.style.animation = 'none';
  requestAnimationFrame(() => { container.style.animation = ''; });

  // Init charts after DOM is ready
  requestAnimationFrame(() => {
    if (page === 'dashboard') { initDashboardCharts(); setTimeout(initDashboardMiniMap, 100); }
    if (page === 'keuangan')  initKeuanganCharts();
    if (page === 'laporan')   initLaporanCharts();
    if (page === 'cuaca')     initCuacaCharts();
    if (page === 'peta')      setTimeout(initPetaMap, 100);
    if (page === 'tim')       setTimeout(loadTimData, 100);
  });

  // Close mobile sidebar on navigate
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('sidebarOverlay')?.classList.remove('mobile-open');
  }
}

// ─── Sidebar Toggle ───────────────────────────────────────────────────────────
function initSidebar() {
  const sidebar    = document.getElementById('sidebar');
  const main       = document.getElementById('mainContent');
  const toggleBtn  = document.getElementById('sidebarToggle');
  const mobileBtn  = document.getElementById('mobileMenuBtn');

  toggleBtn?.addEventListener('click', () => {
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
    main.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  });

  mobileBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    document.getElementById('sidebarOverlay')?.classList.toggle('mobile-open');
  });

  document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    document.getElementById('sidebarOverlay')?.classList.remove('mobile-open');
  });

  // Nav item clicks
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function initTheme() {
  const btn = document.getElementById('themeToggle');
  btn?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    btn.title = isDark ? 'Mode terang' : 'Mode gelap';
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(title, bodyHtml, onSave) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalOverlay').classList.add('open');
  currentModalSave = onSave;

  // Focus first input
  setTimeout(() => {
    const first = document.querySelector('#modalBody input, #modalBody select');
    if (first) first.focus();
  }, 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  currentModalSave = null;
}

function initModal() {
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('modalCancel')?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.getElementById('modalSave')?.addEventListener('click', () => {
    if (currentModalSave) { currentModalSave(); closeModal(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(type, title, msg, duration = 3500) {
  const icons = { success:'✅', danger:'❌', warning:'⚠️', info:'ℹ️' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '📢'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('exiting');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Global Search (basic filter) ────────────────────────────────────────────
function initSearch() {
  const searchInput = document.getElementById('globalSearch');
  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) return;
      // Simple navigation hint based on query
      if (['tanaman','sawit','karet','kopi','kakao'].some(k=>q.includes(k))) navigate('tanaman');
      else if (['lahan','blok','kebun'].some(k=>q.includes(k))) navigate('lahan');
      else if (['karyawan','pegawai','pekerja'].some(k=>q.includes(k))) navigate('karyawan');
      else if (['panen','panen','hasil'].some(k=>q.includes(k))) navigate('panen');
      else if (['keuangan','biaya','modal','untung','rugi','laba'].some(k=>q.includes(k))) navigate('keuangan');
      else if (['laporan','analitik','grafik'].some(k=>q.includes(k))) navigate('laporan');
      else if (['cuaca','hujan','temperatur'].some(k=>q.includes(k))) navigate('cuaca');
      else if (['peta','maps','koordinat','gps','lokasi'].some(k=>q.includes(k))) navigate('peta');
      else showToast('info','Pencarian','Cari: "'+q+'" — navigasi ke halaman yang relevan.');
      searchInput.value = '';
    }
  });
}

// ─── Notifications button ─────────────────────────────────────────────────────
function initNotif() {
  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('warning','Peringatan Baru','Serangan hama terdeteksi di Blok C (Kakao)!', 5000);
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTheme();
  initModal();
  initSearch();
  initNotif();
  navigate('dashboard');
  // Welcome toast
  setTimeout(() => showToast('success','Selamat datang!','Sistem AgroSmart siap digunakan.'), 600);
});

// ─── Role-based UI ─────────────────────────────────────────────────────────────
function applyRoleUI(role, permissions) {
  // Tampilkan nav Tim hanya untuk owner
  document.querySelectorAll('.nav-owner-only').forEach(el => {
    el.style.display = (role === 'owner') ? '' : 'none';
  });

  // Tampilkan nav Admin hanya untuk superadmin
  document.querySelectorAll('.nav-superadmin-only').forEach(el => {
    el.style.display = (role === 'superadmin') ? '' : 'none';
  });

  // Untuk operator: sembunyikan modul yang tidak punya akses di nav
  if (role === 'operator' && permissions) {
    const moduleNavMap = {
      lahan: 'nav-lahan', tanaman: 'nav-tanaman', karyawan: 'nav-karyawan',
      panen: 'nav-panen', keuangan: 'nav-keuangan', laporan: 'nav-laporan',
      peta: 'nav-peta', cuaca: 'nav-cuaca',
    };
    Object.entries(moduleNavMap).forEach(([mod, navId]) => {
      const navEl = document.getElementById(navId);
      if (navEl && permissions[mod] === false) navEl.style.display = 'none';
    });
  }

  // Tampilkan badge role di sidebar (opsional)
  const roleEl = document.getElementById('sidebarUsaha');
  if (roleEl && role !== 'owner') {
    const badge = role === 'superadmin' ? '🛡️ Superadmin' : '👷 Operator';
    roleEl.setAttribute('data-role-badge', badge);
  }
}

// --- Populate sidebar with live user profile ----------------------------------
async function initUserProfile() {
  try {
    if (typeof sb === 'undefined' || SUPABASE_URL.includes('GANTI')) {
      const n = document.getElementById('sidebarNama');
      const u = document.getElementById('sidebarUsaha');
      const a = document.getElementById('sidebarAvatar');
      if (n) n.textContent = 'Demo Mode';
      if (u) u.textContent = 'Belum dikonfigurasi';
      if (a) a.textContent = 'DM';
      return;
    }
    const session = await getSession();
    if (!session) { window.location.href = 'auth.html'; return; }

    window._currentUserId = session.user.id;

    const profile = await loadProfile(session.user.id);
    window.state = { session, profile }; // Store globally for other modules

    const nama    = profile?.nama_pemilik || session.user.user_metadata?.full_name || session.user.email;
    const usaha   = profile?.nama_usaha   || 'AgroSmart';
    const initials = nama.split(' ').map(function(n){ return n[0]; }).slice(0, 2).join('').toUpperCase();

    const nEl = document.getElementById('sidebarNama');
    const uEl = document.getElementById('sidebarUsaha');
    const aEl = document.getElementById('sidebarAvatar');
    if (nEl) nEl.textContent = nama;
    if (uEl) uEl.textContent = usaha;
    if (aEl) aEl.textContent = initials;

    // ── Inisialisasi Role ──────────────────────────────────────────────
    await getMyRole(session.user.id); // simpan ke window.APP_ROLE

    if (isOperator()) {
      await initOperatorContext(session.user.id); // simpan APP_OWNER_ID + APP_PERMISSIONS
    }

    applyRoleUI(window.APP_ROLE, window.APP_PERMISSIONS);

    // Superadmin langsung redirect ke admin panel
    if (isSuperadmin()) {
      window.location.href = 'admin.html';
    }

  } catch (e) {
    console.info('AgroSmart running in demo mode (Supabase not configured).');
    const n = document.getElementById('sidebarNama');
    const u = document.getElementById('sidebarUsaha');
    const a = document.getElementById('sidebarAvatar');
    if (n) n.textContent = 'Demo Mode';
    if (u) u.textContent = 'Konfigurasi Supabase';
    if (a) a.textContent = 'DM';
  }
}

// Override DOMContentLoaded to add initUserProfile call
document.addEventListener('DOMContentLoaded', function() {
  // initUserProfile is called after all other init (non-blocking)
  setTimeout(initUserProfile, 0);
  // Load sidebar badges setelah data ready
  setTimeout(updateSidebarBadges, 1500);
});

// Update sidebar nav badges dengan jumlah real
async function updateSidebarBadges() {
  if (window.APP_ROLE === 'operator' && !window.APP_OWNER_ID) return;
  try {
    const [{ data: lT }, { data: lL }, { data: lK }] = await Promise.all([
      SB.tanaman.fetch(), SB.lahan.fetch(), SB.karyawan.fetch()
    ]);
    const badges = {
      'nav-tanaman' : (lT||[]).length,
      'nav-lahan'   : (lL||[]).length,
      'nav-karyawan': (lK||[]).length,
    };
    Object.entries(badges).forEach(([id, count]) => {
      const el = document.querySelector(`#${id} .nav-badge`);
      if (el && count > 0) el.textContent = count;
      else if (el) el.style.display = 'none';
    });
  } catch (e) { /* silent fail */ }
}
