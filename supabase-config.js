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
window.APP_ASSIGNED_LAHAN = [];     // untuk filtering lahan
window.APP_ASSIGNED_LAHAN_NAMES = []; // untuk filtering modul (Tanaman, Biaya)
window.APP_SEASON_ID   = null;   // ID periode tanam aktif (jika ada)
window.APP_SEASON      = null;   // Object periode tanam aktif

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
  console.log('[DEBUG] initOperatorContext for:', userId);
  const { data, error } = await sb
    .from('team_members')
    .select('owner_id, permissions, assigned_lahan, role_label, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle(); // maybeSingle doesn't error on 0 rows
  
  if (error) {
    console.error('[DEBUG] initOperatorContext Error:', error.message);
    return null;
  }
  
  if (data) {
    console.log('[DEBUG] initOperatorContext Found Data:', data);
    window.APP_OWNER_ID    = data.owner_id;
    window.APP_PERMISSIONS = data.permissions;
    window.APP_ASSIGNED_LAHAN = data.assigned_lahan || [];
    
    // Ambil nama lahan untuk filtering di modul lain
    if (window.APP_ASSIGNED_LAHAN.length > 0) {
      const { data: names } = await sb.from('lahan').select('nama').in('id', window.APP_ASSIGNED_LAHAN);
      window.APP_ASSIGNED_LAHAN_NAMES = (names || []).map(n => n.nama);
      console.log('[DEBUG] Assigned Lahan Names:', window.APP_ASSIGNED_LAHAN_NAMES);
    }
  } else {
    console.warn('[DEBUG] initOperatorContext: No active team member row found for this user.');
  }
  return data;
}

/**
 * Cek apakah user berhak akses modul & aksi tertentu
 * @param {string} module 'lahan','tanaman','karyawan','panen','keuangan','laporan','cuaca','peta'
 * @param {'view'|'add'|'edit'|'delete'} action
 */
function canAccess(module, action = 'view') {
  if (isSuperadmin() || isOwner()) return true;
  if (!window.APP_PERMISSIONS) return false;
  
  const mPerms = window.APP_PERMISSIONS[module];
  if (!mPerms) return false;

  // Jika format lama (boolean), anggap sebagai permission 'view'
  if (typeof mPerms === 'boolean') {
    if (action === 'view') return mPerms;
    if (action === 'edit' || action === 'add') return window.APP_PERMISSIONS['edit'] === true; // backward compat
    if (action === 'delete') return window.APP_PERMISSIONS['hapus'] === true; // backward compat
    return false;
  }

  return mPerms[action] === true;
}

// ─── Data Helpers (CRUD per tabel) ───────────────────────────────────────────

function _withUserId(data) {
  // Jika app_owner_id ada (berarti sedang login sbg operator), gunakan itu.
  // Jika tidak, gunakan user id aktif (berarti sedang login sbg owner).
  const uid = window.APP_OWNER_ID || window._currentUserId;
  const inject = d => ({
    ...d, 
    user_id: d.user_id || uid,
    // Jika tidak explicitly set season_id dan ada APP_SEASON_ID, maka otomatis set
    season_id: d.season_id !== undefined ? d.season_id : (window.APP_SEASON_ID || null)
  });
  return Array.isArray(data) ? data.map(inject) : inject(data);
}

const SB = {
  /** SEASONS (Periode Tanam) */
  seasons: {
    fetch:  () => {
      let ownerId = window.APP_OWNER_ID || window._currentUserId;
      return sb.from('planting_seasons').select('*').eq('user_id', ownerId).order('created_at', { ascending: false });
    },
    active: () => {
      let ownerId = window.APP_OWNER_ID || window._currentUserId;
      return sb.from('planting_seasons').select('*').eq('user_id', ownerId).eq('status', 'aktif').order('created_at', { ascending: false }).limit(1).maybeSingle();
    },
    insert: (data)       => sb.from('planting_seasons').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('planting_seasons').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('planting_seasons').delete().eq('id', id),
    close:  (id)         => sb.rpc('close_planting_season', { p_season_id: id })
  },
  /** LAHAN */
  lahan: {
    fetch:  (uid)       => {
      let ownerId = uid || window.APP_OWNER_ID || window._currentUserId;
      console.log('[DEBUG] lahan.fetch ownerId:', ownerId, 'isOperator:', isOperator());
      let q = sb.from('lahan').select('*').eq('user_id', ownerId).order('created_at');
      
      if (isOperator() && window.APP_OWNER_ID) {
        const assigned = window.APP_ASSIGNED_LAHAN || [];
        if (assigned.length > 0) q = q.in('id', assigned);
        else q = q.eq('id', -1); 
      }
      
      return q.then(res => {
        console.log('[DEBUG] lahan.fetch result rows:', (res.data||[]).length, 'error:', res.error);
        return res;
      });
    },
    insert: (data)       => sb.from('lahan').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('lahan').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('lahan').delete().eq('id', id),
  },
  /** TANAMAN */
  tanaman: {
    fetch:  (uid)       => {
      let ownerId = uid || window.APP_OWNER_ID || window._currentUserId;
      console.log('[DEBUG] tanaman.fetch ownerId:', ownerId, 'isOperator:', isOperator());
      let q = sb.from('tanaman').select('*').eq('user_id', ownerId).order('created_at');

      if (isOperator() && window.APP_OWNER_ID) {
         const assignedNames = window.APP_ASSIGNED_LAHAN_NAMES || [];
         if (assignedNames.length > 0) q = q.in('lahan', assignedNames);
         else q = q.eq('lahan', '___NONE___'); 
      }
      
      return q.then(res => {
        console.log('[DEBUG] tanaman.fetch result rows:', (res.data||[]).length, 'error:', res.error);
        return res;
      });
    },
    insert: (data)       => sb.from('tanaman').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('tanaman').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('tanaman').delete().eq('id', id),
  },
  /** KARYAWAN */
  karyawan: {
    fetch:  (uid)       => {
      let ownerId = uid || window.APP_OWNER_ID || window._currentUserId;
      let q = sb.from('karyawan').select('*').eq('user_id', ownerId).order('created_at');
      return q;
    },
    insert: (data)       => sb.from('karyawan').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('karyawan').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('karyawan').delete().eq('id', id),
  },
  /** PANEN */
  panen: {
    fetch:  (uid)       => {
      let ownerId = uid || window.APP_OWNER_ID || window._currentUserId;
      console.log('[DEBUG] panen.fetch ownerId:', ownerId);
      let q = sb.from('panen').select('*').eq('user_id', ownerId).order('tanggal', { ascending: false });
      
      if (isOperator() && window.APP_OWNER_ID) {
        const assignedNames = window.APP_ASSIGNED_LAHAN_NAMES || [];
        if (assignedNames.length > 0) q = q.in('lahan', assignedNames);
        else q = q.eq('lahan', '___NONE___');
      }
      
      return q.then(res => {
        console.log('[DEBUG] panen.fetch result rows:', (res.data||[]).length, 'error:', res.error);
        return res;
      });
    },
    insert: (data)       => sb.from('panen').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('panen').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('panen').delete().eq('id', id),
  },
  /** BIAYA */
  biaya: {
    fetch:  (uid)       => {
      let ownerId = uid || window.APP_OWNER_ID || window._currentUserId;
      console.log('[DEBUG] biaya.fetch ownerId:', ownerId);
      let q = sb.from('biaya').select('*').eq('user_id', ownerId).order('tanggal', { ascending: false });
      
      if (isOperator() && window.APP_OWNER_ID) {
        const assignedNames = window.APP_ASSIGNED_LAHAN_NAMES || [];
        if (assignedNames.length > 0) q = q.in('lahan', assignedNames);
        else q = q.eq('lahan', '___NONE___');
      }
      
      return q.then(res => {
        console.log('[DEBUG] biaya.fetch result rows:', (res.data||[]).length, 'error:', res.error);
        return res;
      });
    },
    insert: (data)       => sb.from('biaya').insert(_withUserId(data)).select().single(),
    update: (id, data)   => sb.from('biaya').update(data).eq('id', id).select().single(),
    remove: (id)         => sb.from('biaya').delete().eq('id', id),
  },
  /** CATEGORIES AND UNITS */
  expense_categories: {
    fetch:  (uid)      => {
      let ownerId = uid || window.APP_OWNER_ID || window._currentUserId;
      return sb.from('expense_categories').select('*').eq('user_id', ownerId).order('name');
    },
    insert: (data)      => sb.from('expense_categories').insert(_withUserId(data)).select().single(),
    update: (id, data)  => sb.from('expense_categories').update(data).eq('id', id).select().single(),
    remove: (id)        => sb.from('expense_categories').delete().eq('id', id),
  },
  units: {
    fetch:  (type, uid) => {
      let ownerId = uid || window.APP_OWNER_ID || window._currentUserId;
      let q = sb.from('units').select('*').eq('user_id', ownerId);
      if (type && type !== 'semua') {
        q = q.or(`type.eq.${type},type.eq.semua`);
      }
      return q.order('name');
    },
    insert: (data)      => sb.from('units').insert(_withUserId(data)).select().single(),
    update: (id, data)  => sb.from('units').update(data).eq('id', id).select().single(),
    remove: (id)        => sb.from('units').delete().eq('id', id),
  },
  /** CASH BOOK */
  cash_book: {
    fetch:  (uid)      => {
      let ownerId = uid || window.APP_OWNER_ID || window._currentUserId;
      return sb.from('cash_book').select('*').eq('user_id', ownerId).order('tanggal', { ascending: false });
    },
    insert: (data)      => sb.from('cash_book').insert(_withUserId(data)).select().single(),
    update: (id, data)  => sb.from('cash_book').update(data).eq('id', id).select().single(),
    remove: (id)        => sb.from('cash_book').delete().eq('id', id),
  },
  /** CHART OF ACCOUNTS */
  coa: {
    fetch:  (uid)      => {
      let ownerId = uid || window.APP_OWNER_ID || window._currentUserId;
      return sb.from('chart_of_accounts').select('*').eq('user_id', ownerId).order('account_code');
    },
    insert: (data)      => sb.from('chart_of_accounts').insert(_withUserId(data)).select().single(),
    update: (id, data)  => sb.from('chart_of_accounts').update(data).eq('id', id).select().single(),
    remove: (id)        => sb.from('chart_of_accounts').delete().eq('id', id),
  },
  /** AKTIVITAS */
  aktivitas: {
    fetch:  (limit = 10, uid) => {
      // Fix: jika limit diteruskan sbg angka, jangan gunakan sbg ownerId
      let ownerId = (typeof limit === 'string' && limit.length > 20) ? limit : (uid || window.APP_OWNER_ID || window._currentUserId);
      console.log('[DEBUG] aktivitas.fetch ownerId:', ownerId, 'limit:', limit);
      let q = sb.from('aktivitas').select('*').eq('user_id', ownerId).order('created_at', { ascending: false }).limit(typeof limit === 'number' ? limit : 10);
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
  /** LICENSES */
  licenses: {
    fetch:       ()        => sb.from('licenses').select('*').order('created_at', { ascending: false }),
    fetchMine:   ()        => sb.from('licenses').select('*').eq('owner_id', window._currentUserId).maybeSingle(),
    activate:    (key)     => sb.rpc('activate_license', { p_key: key }),
    myStatus:    ()        => sb.rpc('get_my_license_status'),
    insert:      (rows)    => sb.from('licenses').insert(rows),
    revoke:      (id)      => sb.from('licenses').update({ is_active: false }).eq('id', id),
    reactivate:  (id)      => sb.from('licenses').update({ is_active: true  }).eq('id', id),
  },
  /** AUTH FLOW FOR OPERATORS */
  auth: {
    checkInvitation: (email, password) => sb.rpc('check_operator_invite', { p_email: email, p_password: password }),
    linkTeamMember: (inviteId) => sb.rpc('link_team_member', { p_invite_id: inviteId }),
  }
};

async function logActivity(judul, deskripsi = '') {
  await SB.aktivitas.insert(judul, deskripsi);
}


