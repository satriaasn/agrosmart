/* =============================================
   AgroSmart — Supabase Client Configuration v2

   CARA ISI:
   1. Buka https://supabase.com/dashboard
   2. Pilih project → Settings → API
   3. Copy "Project URL" ke SUPABASE_URL
   4. Copy "anon / public" key ke SUPABASE_ANON_KEY
   ============================================= */

const SUPABASE_URL      = 'https://crnxgaaudbsqguranglb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnhnYWF1ZGJzcWd1cmFuZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzYxNDIsImV4cCI6MjA4ODgxMjE0Mn0.0DDwhoAEt4su7fww-b--Cecdr4YP6dEZuc-OSIYBxZg';

// Client instance
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

// ─── Global App Context (diisi oleh initUserProfile di app.js) ────────────────
window.APP_ROLE        = null;   // 'superadmin' | 'owner' | 'operator'
window.APP_PERMISSIONS = null;   // null (owner/superadmin = full) | jsonb object (operator)
window.APP_OWNER_ID    = null;   // untuk operator: UUID pemilik bisnis

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

async function getCurrentUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function isOnboardingDone(userId) {
  const { data } = await sb.from('profiles').select('onboarding_done').eq('id', userId).single();
  return data?.onboarding_done === true;
}

async function requireAuth() {
  const session = await getSession();
  if (!session) { window.location.href = 'auth.html'; return null; }
  return session;
}

async function loadProfile(userId) {
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (error) console.warn('loadProfile:', error.message);
  return data;
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = 'auth.html';
}

// ─── Role Helpers ─────────────────────────────────────────────────────────────

/** Ambil role dari profil, simpan ke window.APP_ROLE */
async function getMyRole(userId) {
  const profile = await loadProfile(userId);
  window.APP_ROLE = profile?.role || 'owner';
  return window.APP_ROLE;
}

function isSuperadmin() { return window.APP_ROLE === 'superadmin'; }
function isOwner()      { return window.APP_ROLE === 'owner'; }
function isOperator()   { return window.APP_ROLE === 'operator'; }

/**
 * Inisialisasi context untuk operator:
 * — ambil owner_id dan permissions dari team_members
 */
async function initOperatorContext(userId) {
  const { data } = await sb
    .from('team_members')
    .select('owner_id, permissions, role_label, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  if (data) {
    window.APP_OWNER_ID    = data.owner_id;
    window.APP_PERMISSIONS = data.permissions;
  }
  return data;
}

/**
 * Cek apakah user berhak akses modul tertentu
 * @param {'lahan'|'tanaman'|'karyawan'|'panen'|'keuangan'|'laporan'|'cuaca'|'peta'|'edit'|'hapus'} module
 */
function canAccess(module) {
  if (isSuperadmin() || isOwner()) return true;
  if (!window.APP_PERMISSIONS) return false;
  return window.APP_PERMISSIONS[module] === true;
}

// ─── Data Helpers (CRUD per tabel) ───────────────────────────────────────────

function _withUserId(data) {
  // Jika app_owner_id ada (berarti sedang login sbg operator), gunakan itu.
  // Jika tidak, gunakan user id aktif (berarti sedang login sbg owner).
  const uid = window.APP_OWNER_ID || window._currentUserId;
  return Array.isArray(data) 
    ? data.map(d => ({ ...d, user_id: d.user_id || uid }))
    : { ...data, user_id: data.user_id || uid };
}

const SB = {
  /** LAHAN */
  lahan: {
    fetch:  (uid)       => {
      let q = sb.from('lahan').select('*').order('created_at');
      if (uid) q = q.eq('user_id', uid);
      return q;
    },
    insert: (data)       => sb.from('lahan').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('lahan').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('lahan').delete().eq('id', id),
  },
  /** TANAMAN */
  tanaman: {
    fetch:  (uid)       => {
      let q = sb.from('tanaman').select('*').order('created_at');
      if (uid) q = q.eq('user_id', uid);
      return q;
    },
    insert: (data)       => sb.from('tanaman').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('tanaman').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('tanaman').delete().eq('id', id),
  },
  /** KARYAWAN */
  karyawan: {
    fetch:  (uid)       => {
      let q = sb.from('karyawan').select('*').order('created_at');
      if (uid) q = q.eq('user_id', uid);
      return q;
    },
    insert: (data)       => sb.from('karyawan').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('karyawan').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('karyawan').delete().eq('id', id),
  },
  /** PANEN */
  panen: {
    fetch:  (uid)       => {
      let q = sb.from('panen').select('*').order('tanggal', { ascending: false });
      if (uid) q = q.eq('user_id', uid);
      return q;
    },
    insert: (data)       => sb.from('panen').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('panen').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('panen').delete().eq('id', id),
  },
  /** BIAYA */
  biaya: {
    fetch:  (uid)       => {
      let q = sb.from('biaya').select('*').order('tanggal', { ascending: false });
      if (uid) q = q.eq('user_id', uid);
      return q;
    },
    insert: (data)       => sb.from('biaya').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('biaya').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('biaya').delete().eq('id', id),
  },
  /** AKTIVITAS */
  aktivitas: {
    fetch:  (limit = 10, uid) => {
      let q = sb.from('aktivitas').select('*').order('created_at', { ascending: false }).limit(limit);
      if (uid) q = q.eq('user_id', uid);
      return q;
    },
    insert: (judul, desc)=> sb.from('aktivitas').insert(_withUserId({ judul, deskripsi: desc })),
  },
  /** TEAM MEMBERS (untuk owner kelola operator) */
  team: {
    fetch:   (ownerId)       => sb.from('team_members').select('*').eq('owner_id', ownerId).order('created_at'),
    invite:  (data)          => sb.from('team_members').insert(data).select().single(),
    update:  (id, data)      => sb.from('team_members').update(data).eq('id', id).select().single(),
    remove:  (id)            => sb.from('team_members').delete().eq('id', id),
    byEmail: (email, ownerId)=> sb.from('team_members').select('*').eq('owner_id', ownerId).eq('invited_email', email).single(),
    activate:(id)            => sb.from('team_members').update({ status: 'active' }).eq('id', id),
    suspend: (id)            => sb.from('team_members').update({ status: 'suspended' }).eq('id', id),
  },
  /** ADMIN: semua profil (superadmin only) */
  admin: {
    allProfiles: () => sb.from('profiles').select('*').order('created_at', { ascending: false }),
    suspendUser: (id)   => sb.from('profiles').update({ is_suspended: true  }).eq('id', id),
    activateUser:(id)   => sb.from('profiles').update({ is_suspended: false }).eq('id', id),
    setRole:     (id, role) => sb.from('profiles').update({ role }).eq('id', id),
    allActivities:() => sb.from('aktivitas').select('*, profiles(nama_usaha)').order('created_at', { ascending: false }).limit(50),
  },
  /** AUTH FLOW FOR OPERATORS */
  auth: {
    checkInvitation: (email) => sb.from('team_members').select('*').eq('invited_email', email).eq('status', 'pending').single(),
    completeTeamMember: (id, userId) => sb.from('team_members').update({ user_id: userId, status: 'active' }).eq('id', id),
  }
};

async function logActivity(judul, deskripsi = '') {
  await SB.aktivitas.insert(judul, deskripsi);
}


