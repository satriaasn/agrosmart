/* =============================================
   AgroSmart — Page: Profil & Pengaturan Akun
   - Edit Data Usaha (nama, jenis, alamat, logo)
   - Edit Data Pemilik (nama, telepon, bio)
   - Upload Foto Profil
   - Ganti Password
   - Hapus Akun (hati-hati)
   ============================================= */

// ─── Render Halaman Profil ────────────────────────────────────────────────────
async function renderProfil() {
  const session = await getSession();
  if (!session) return '<div class="alert">Sesi tidak valid.</div>';

  const uid = session.user.id;
  const profile = await loadProfile(uid);
  const email   = session.user.email || '';
  const isGoogle = session.user.app_metadata?.provider === 'google';

  const nama      = profile?.nama_pemilik || '';
  const namaUsaha = profile?.nama_usaha   || '';
  const jenis     = profile?.jenis_usaha  || '';
  const alamat    = profile?.alamat       || '';
  const telepon   = profile?.telepon      || '';
  const bio       = profile?.deskripsi    || '';  // kolom di DB: deskripsi
  const logoUrl   = profile?.logo_url     || '';

  const avatar = nama ? nama.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : '??';

  return `
<div class="page-header">
  <div>
    <div class="page-title">Profil & Pengaturan</div>
    <div class="page-subtitle">Kelola informasi akun dan usaha Anda</div>
  </div>
</div>

<div class="profile-layout">

  <!-- KIRI: Avatar & Identitas -->
  <div style="display:flex;flex-direction:column;gap:16px">
    <!-- Kartu Avatar -->
    <div class="card" style="text-align:center;padding:28px 20px">
      <div id="profilAvatarWrap" style="position:relative;display:inline-block;margin-bottom:12px">
        ${logoUrl
          ? `<img src="${logoUrl}" id="profilAvatarImg" style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid var(--accent-primary)">`
          : `<div id="profilAvatarImg" style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#059669,#10b981);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff;border:3px solid var(--accent-primary);margin:0 auto">${avatar}</div>`
        }
        <label for="logoUpload" title="Ganti foto" style="position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:var(--accent-primary);display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid var(--bg-primary)">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" style="width:13px;height:13px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </label>
        <input type="file" id="logoUpload" accept="image/*" style="display:none" onchange="previewLogo(this)">
      </div>
      <div style="font-size:15px;font-weight:700;color:var(--text-primary)">${nama || '—'}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${email}</div>
      <div style="margin-top:8px">
        <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:var(--accent-bg);color:var(--accent-primary);font-weight:600">
          ${window.APP_ROLE === 'superadmin' ? '🛡️ Superadmin' : window.APP_ROLE === 'operator' ? '👷 Operator' : '👤 Owner'}
        </span>
      </div>
      ${isGoogle ? '<div style="margin-top:10px;font-size:11px;color:var(--text-muted)">Login via Google</div>' : ''}
    </div>

    <!-- Quick Info -->
    <div class="card" style="padding:16px 18px">
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em">Info Akun</div>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;color:var(--text-secondary)">
        <div style="display:flex;justify-content:space-between"><span>Email</span><span style="color:var(--text-primary);font-weight:500">${email.length > 20 ? email.slice(0,20)+'…' : email}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Telepon</span><span style="color:var(--text-primary);font-weight:500">${telepon || '—'}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Jenis Usaha</span><span style="color:var(--text-primary);font-weight:500">${jenis || '—'}</span></div>
      </div>
    </div>
  </div>

  <!-- KANAN: Form Edit -->
  <div style="display:flex;flex-direction:column;gap:20px">

    <!-- 1. Data Usaha -->
    <div class="card">
      <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:18px">
        <div style="font-size:15px;font-weight:700;color:var(--text-primary)">🏢 Data Usaha</div>
        <div style="font-size:12px;color:var(--text-muted)">Informasi bisnis perkebunan Anda</div>
      </div>
      <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Nama Usaha *</label>
          <input type="text" id="pf_namaUsaha" class="form-control" value="${namaUsaha}" placeholder="Contoh: Kebun Makmur Sejahtera">
        </div>
        <div class="form-group">
          <label class="form-label">Jenis Usaha</label>
          <select id="pf_jenisUsaha" class="form-control">
            <option value="">— Pilih —</option>
            ${['Sawah','Kebun','Ladang','Greenhouse','Campuran','Lainnya'].map(j=>`<option value="${j}"${jenis===j?' selected':''}>${j}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Telepon Usaha</label>
          <input type="tel" id="pf_telepon" class="form-control" value="${telepon}" placeholder="08xxxxxxxxxx">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Alamat Usaha</label>
          <textarea id="pf_alamat" class="form-control" rows="2" placeholder="Jl. Kebun No.1, Desa...">${alamat}</textarea>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:4px">
        <button class="btn btn-primary" onclick="simpanDataUsaha()" id="btnSimpanUsaha">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Simpan Data Usaha
        </button>
      </div>
    </div>

    <!-- 2. Data Pemilik -->
    <div class="card">
      <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:18px">
        <div style="font-size:15px;font-weight:700;color:var(--text-primary)">👤 Data Pemilik</div>
        <div style="font-size:12px;color:var(--text-muted)">Informasi pribadi pemilik akun</div>
      </div>
      <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Nama Lengkap *</label>
          <input type="text" id="pf_namaPemilik" class="form-control" value="${nama}" placeholder="Nama lengkap Anda">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Bio / Deskripsi Singkat</label>
          <textarea id="pf_bio" class="form-control" rows="2" placeholder="Cerita singkat tentang usaha Anda...">${bio}</textarea>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:4px">
        <button class="btn btn-primary" onclick="simpanDataPemilik()" id="btnSimpanPemilik">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Simpan Data Pemilik
        </button>
      </div>
    </div>

    <!-- 3. Ganti Password -->
    ${!isGoogle ? `
    <div class="card">
      <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:18px">
        <div style="font-size:15px;font-weight:700;color:var(--text-primary)">🔒 Ganti Password</div>
        <div style="font-size:12px;color:var(--text-muted)">Minimal 6 karakter</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group">
          <label class="form-label">Password Baru</label>
          <div style="position:relative">
            <input type="password" id="pf_passNew" class="form-control" placeholder="Password baru (min. 6 karakter)" style="padding-right:44px">
            <button onclick="togglePass('pf_passNew',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted)">👁</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Konfirmasi Password Baru</label>
          <div style="position:relative">
            <input type="password" id="pf_passConfirm" class="form-control" placeholder="Ulangi password baru" style="padding-right:44px">
            <button onclick="togglePass('pf_passConfirm',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted)">👁</button>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-primary" onclick="gantiPassword()" id="btnGantiPass">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Update Password
        </button>
      </div>
    </div>
    ` : `
    <div class="card" style="opacity:0.7;pointer-events:none">
      <div style="font-size:14px;font-weight:600;color:var(--text-secondary)">🔒 Password dikelola oleh Google</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Akun Anda menggunakan login Google, ubah password melalui akun Google.</div>
    </div>
    `}

    <!-- 4. Pengaturan Data (Kategori & Satuan) -->
    <div class="card">
      <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:18px">
        <div style="font-size:15px;font-weight:700;color:var(--text-primary)">⚙️ Pengaturan Data</div>
        <div style="font-size:12px;color:var(--text-muted)">Atur kategori biaya dan satuan produk Anda</div>
      </div>
      <div class="grid-2" style="gap:20px">
        <div id="katBiayaWrap">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font-size:13px;font-weight:600">Kategori Biaya</div>
            <button class="btn btn-sm btn-secondary" onclick="openAddKatModal()">+ Tambah</button>
          </div>
          <div id="katList" style="display:flex;flex-direction:column;gap:8px">
            <div class="skeleton" style="height:32px;border-radius:6px"></div>
            <div class="skeleton" style="height:32px;border-radius:6px"></div>
          </div>
        </div>
        <div id="satuanWrap">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font-size:13px;font-weight:600">Satuan Produk</div>
            <button class="btn btn-sm btn-secondary" onclick="openAddSatuanModal()">+ Tambah</button>
          </div>
          <div id="satList" style="display:flex;flex-direction:column;gap:8px">
            <div class="skeleton" style="height:32px;border-radius:6px"></div>
            <div class="skeleton" style="height:32px;border-radius:6px"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Zona Bahaya -->
    <div class="card" style="border-color:rgba(239,68,68,0.3)">
      <div style="font-size:15px;font-weight:700;color:#f87171;margin-bottom:8px">⚠️ Zona Bahaya</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Tindakan di bawah ini tidak dapat dibatalkan. Harap berhati-hati.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" onclick="konfirmasiHapusAkun()" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;font-size:13px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          Hapus Akun
        </button>
        <button class="btn btn-ghost" onclick="signOut()" style="font-size:13px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Keluar
        </button>
      </div>
    </div>

  </div>
</div>`;
}

// ─── Preview Logo Upload ───────────────────────────────────────────────────────
window.previewLogo = function(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const el = document.getElementById('profilAvatarImg');
    if (el.tagName === 'IMG') {
      el.src = e.target.result;
    } else {
      el.outerHTML = `<img src="${e.target.result}" id="profilAvatarImg" style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid var(--accent-primary)">`;
    }
  };
  reader.readAsDataURL(input.files[0]);
  // Auto-upload
  uploadLogo(input.files[0]);
};

async function uploadLogo(file) {
  try {
    const session = await getSession();
    if (!session) return;
    const uid = session.user.id;
    const ext = file.name.split('.').pop();
    const path = `logos/${uid}.${ext}`;
    const { error: upErr } = await sb.storage.from('logo').upload(path, file, { upsert: true });
    if (upErr) throw upErr;
    const { data: { publicUrl } } = sb.storage.from('logo').getPublicUrl(path);
    await sb.from('profiles').update({ logo_url: publicUrl }).eq('id', uid);
    // Update sidebar avatar
    const aEl = document.getElementById('sidebarAvatar');
    if (aEl) aEl.style.backgroundImage = `url(${publicUrl})`;
    showToast('success', 'Berhasil', 'Foto profil diperbarui!');
  } catch(e) {
    // If storage not configured, just use preview without saving
    showToast('warning', 'Info', 'Foto berubah di tampilan, tapi belum tersimpan (storage belum aktif).');
  }
}

// ─── Simpan Data Usaha ─────────────────────────────────────────────────────────
window.simpanDataUsaha = async function() {
  const btn = document.getElementById('btnSimpanUsaha');
  const origText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width:14px;height:14px;display:inline-block;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:6px"></span>Menyimpan...`;

  const namaUsaha = document.getElementById('pf_namaUsaha')?.value.trim();
  const jenisUsaha= document.getElementById('pf_jenisUsaha')?.value;
  const telepon   = document.getElementById('pf_telepon')?.value.trim();
  const alamat    = document.getElementById('pf_alamat')?.value.trim();

  if (!namaUsaha) {
    showToast('error','Gagal','Nama usaha tidak boleh kosong!');
    btn.disabled = false; btn.innerHTML = origText; return;
  }

  try {
    const session = await getSession();
    const uid = session.user.id;
    
    // Gunakan upsert alih-alih update untuk menjamin baris profil tercipta
    // jika trigger on_auth_user_created sebelumnya gagal berjalan
    const { data, error } = await sb.from('profiles').upsert({
      id: uid,
      nama_usaha: namaUsaha,
      jenis_usaha: jenisUsaha,
      telepon,
      alamat,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select();

    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn('Upsert Usaha gagal me-return data. RLS Blocked? UID:', uid);
      throw new Error("Gagal menyimpan profil: Akses Ditolak oleh RLS.");
    }

    // Update sidebar
    const uEl = document.getElementById('sidebarUsaha');
    if (uEl) uEl.textContent = namaUsaha;

    showToast('success','Tersimpan!','Data usaha berhasil diperbarui.');
  } catch(e) {
    console.error(e);
    showToast('error','Error', e.message || 'Gagal menyimpan.');
  } finally {
    btn.disabled = false; btn.innerHTML = origText;
  }
};

// ─── Simpan Data Pemilik ───────────────────────────────────────────────────────
window.simpanDataPemilik = async function() {
  const btn = document.getElementById('btnSimpanPemilik');
  const origText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width:14px;height:14px;display:inline-block;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:6px"></span>Menyimpan...`;

  const namaPemilik = document.getElementById('pf_namaPemilik')?.value.trim();
  const bio = document.getElementById('pf_bio')?.value.trim();

  if (!namaPemilik) {
    showToast('error','Gagal','Nama pemilik tidak boleh kosong!');
    btn.disabled = false; btn.innerHTML = origText; return;
  }

  try {
    const session = await getSession();
    const uid = session.user.id;

    // Gunakan upsert untuk menjamin insert if not exists
    const { data, error } = await sb.from('profiles').upsert({
      id: uid,
      nama_pemilik: namaPemilik,
      deskripsi: bio,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select();

    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn('Upsert Pemilik gagal me-return data. UID:', uid);
      throw new Error("Gagal menyimpan pemilik: Akses Ditolak oleh RLS.");
    }

    // Update sidebar nama & avatar inisial
    const nEl = document.getElementById('sidebarNama');
    if (nEl) nEl.textContent = namaPemilik;
    const aEl = document.getElementById('sidebarAvatar');
    if (aEl && !aEl.style.backgroundImage) aEl.textContent = namaPemilik.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();

    showToast('success','Tersimpan!','Data pemilik berhasil diperbarui.');
  } catch(e) {
    console.error(e);
    showToast('error','Error', e.message || 'Gagal menyimpan.');
  } finally {
    btn.disabled = false; btn.innerHTML = origText;
  }
};

// ─── Ganti Password ────────────────────────────────────────────────────────────
window.gantiPassword = async function() {
  const passNew = document.getElementById('pf_passNew')?.value;
  const passConfirm = document.getElementById('pf_passConfirm')?.value;

  if (!passNew || passNew.length < 6) {
    showToast('error','Gagal','Password minimal 6 karakter!'); return;
  }
  if (passNew !== passConfirm) {
    showToast('error','Gagal','Konfirmasi password tidak cocok!'); return;
  }

  const btn = document.getElementById('btnGantiPass');
  const origText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width:14px;height:14px;display:inline-block;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:6px"></span>Memproses...`;

  try {
    const { error } = await sb.auth.updateUser({ password: passNew });
    if (error) throw error;
    // Clear fields
    document.getElementById('pf_passNew').value = '';
    document.getElementById('pf_passConfirm').value = '';
    showToast('success','Password diperbarui!','Gunakan password baru saat login berikutnya.');
  } catch(e) {
    console.error(e);
    showToast('error','Gagal ganti password', e.message || 'Terjadi kesalahan.');
  } finally {
    btn.disabled = false; btn.innerHTML = origText;
  }
};

// ─── Toggle Password Visibility ────────────────────────────────────────────────
window.togglePass = function(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
};

// ─── Hapus Akun ────────────────────────────────────────────────────────────────
window.konfirmasiHapusAkun = function() {
  openModal(
    '⚠️ Hapus Akun Permanen',
    `<div style="color:var(--text-secondary);line-height:1.6">
      <p style="margin:0 0 12px">Tindakan ini akan <strong style="color:#f87171">menghapus semua data Anda secara permanen</strong>, termasuk:</p>
      <ul style="margin:0 0 16px;padding-left:20px;display:flex;flex-direction:column;gap:6px">
        <li>Semua data lahan, tanaman, karyawan</li>
        <li>Semua catatan panen dan keuangan</li>
        <li>Semua anggota tim yang Anda undang</li>
        <li>Akun login Anda</li>
      </ul>
      <p style="margin:0;color:#f87171;font-weight:600">Tindakan ini TIDAK dapat dibatalkan!</p>
      <div class="form-group" style="margin-top:16px">
        <label class="form-label">Ketik <strong>HAPUS AKUN</strong> untuk konfirmasi:</label>
        <input type="text" id="confirmDeleteText" class="form-control" placeholder="HAPUS AKUN">
      </div>
    </div>`,
    async () => {
      const conf = document.getElementById('confirmDeleteText')?.value;
      if (conf !== 'HAPUS AKUN') {
        showToast('error','Gagal','Ketik "HAPUS AKUN" dengan benar untuk melanjutkan.'); return false;
      }
      try {
        const session = await getSession();
        const uid = session.user.id;
        // Hapus semua data user
        await Promise.all([
          sb.from('tanaman').delete().eq('user_id', uid),
          sb.from('lahan').delete().eq('user_id', uid),
          sb.from('karyawan').delete().eq('user_id', uid),
          sb.from('panen').delete().eq('user_id', uid),
          sb.from('biaya').delete().eq('user_id', uid),
          sb.from('aktivitas').delete().eq('user_id', uid),
          sb.from('team_members').delete().eq('owner_id', uid),
        ]);
        await sb.from('profiles').delete().eq('id', uid);
        await sb.auth.signOut();
        showToast('success','Akun dihapus','Semua data telah dihapus. Sampai jumpa!');
        setTimeout(() => { window.location.href = 'auth.html'; }, 2000);
      } catch(e) {
        showToast('error','Gagal hapus akun', e.message);
      }
    }
  );
};

// ─── Manajemen Kategori & Satuan ─────────────────────────────────────────────
window.loadMetadata = async function() {
  // Tunggu sejenak jika session belum siap
  const ownerId = window.APP_OWNER_ID || window._currentUserId;
  if (!ownerId) {
    console.warn('[DEBUG] loadMetadata: User ID not ready, retrying in 500ms...');
    setTimeout(loadMetadata, 500);
    return;
  }

  const [{ data: kats, error: kErr }, { data: sats, error: sErr }, { data: coas }] = await Promise.all([
    SB.expense_categories.fetch(),
    SB.units.fetch(),
    SB.coa.fetch()
  ]);
  window._CACHE_COA = coas || [];

  if (kErr || sErr) {
    console.error('Metadata fetch error:', kErr || sErr);
    const msg = (kErr?.message || sErr?.message || '').includes('not found') 
      ? 'Tabel tidak ditemukan. Pastikan Anda sudah menjalankan SQL patch.'
      : 'Gagal memuat data dari server.';
    
    if (document.getElementById('katList')) {
      document.getElementById('katList').innerHTML = `<div class="alert alert-danger" style="font-size:11px;padding:8px">${msg}</div>`;
      document.getElementById('satList').innerHTML = `<div class="alert alert-danger" style="font-size:11px;padding:8px">${msg}</div>`;
    }
    return;
  }

  // Seed default if empty
  if ((kats||[]).length === 0 && (sats||[]).length === 0) {
    console.log('[DEBUG] Metadata empty, seeding defaults...');
    await seedDefaults();
    return loadMetadata();
  }

  renderKatList(kats || []);
  renderSatList(sats || []);
};

function renderKatList(data) {
  const el = document.getElementById('katList');
  if (!el) return;
  if (data.length === 0) {
    el.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:8px;text-align:center">Belum ada kategori</div>`;
    return;
  }
  el.innerHTML = data.map(k => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-secondary);border-radius:8px;border:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:16px">${k.icon || '📋'}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${k.name}</span>
      </div>
      <button onclick="deleteKat('${k.id}')" style="background:none;border:none;cursor:pointer;color:#f87171;padding:4px;display:flex" title="Hapus">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>
  `).join('');
}

function renderSatList(data) {
  const el = document.getElementById('satList');
  if (!el) return;
  if (data.length === 0) {
    el.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:8px;text-align:center">Belum ada satuan</div>`;
    return;
  }
  el.innerHTML = data.map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-secondary);border-radius:8px;border:1px solid var(--border)">
      <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${s.name} <small style="color:var(--text-muted);font-weight:400;margin-left:4px">(${s.type})</small></span>
      <button onclick="deleteSatuan('${s.id}')" style="background:none;border:none;cursor:pointer;color:#f87171;padding:4px;display:flex" title="Hapus">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>
  `).join('');
}

async function seedDefaults() {
  const defaultKats = [
    { name: 'Pupuk & Nutrisi', icon: '🌱', color: '#22c55e' },
    { name: 'Obat & Pestisida', icon: '🧪', color: '#f59e0b' },
    { name: 'Bibit / Benih', icon: '🥯', color: '#84cc16' },
    { name: 'Gaji Karyawan', icon: '👷', color: '#3b82f6' },
    { name: 'Peralatan Kebun', icon: '⚙️', color: '#ef4444' },
    { name: 'BBM & Transport', icon: '🚛', color: '#6b7280' },
    { name: 'Lain-lain', icon: '📋', color: '#64748b' }
  ];
  const defaultSats = [
    { name: 'kg', type: 'semua' },
    { name: 'liter', type: 'semua' },
    { name: 'ton', type: 'panen' },
    { name: 'karung', type: 'biaya' },
    { name: 'botol', type: 'biaya' },
    { name: 'orang/hari', type: 'biaya' },
    { name: 'buah', type: 'panen' },
    { name: 'ikat', type: 'panen' }
  ];
  
  try {
    const ownerId = window.APP_OWNER_ID || window._currentUserId;
    if (!ownerId) throw new Error('User context not ready for seeding');
    
    await Promise.all([
      ...defaultKats.map(k => SB.expense_categories.insert(k)),
      ...defaultSats.map(s => SB.units.insert(s))
    ]);
    console.log('[DEBUG] Seeding completed successfully.');
  } catch(e) {
    console.error('[DEBUG] Seeding failed:', e);
  }
}

window.openAddKatModal = function() {
  const coas = window._CACHE_COA || [];
  openModal('Tambah Kategori Biaya', `
    <div class="form-group"><label class="form-label">Nama Kategori</label><input class="form-control" id="f-katNama" placeholder="Contoh: Listrik"></div>
    <div class="form-group"><label class="form-label">Ikon (Emoji)</label><input class="form-control" id="f-katIkon" value="📋"></div>
    <div class="form-group"><label class="form-label">Hubungkan ke Akun (COA)</label>
      <select class="form-control" id="f-katCOA">
        <option value="">-- Tanpa Hubungan --</option>
        ${coas.filter(a => !a.is_header).map(a => `<option value="${a.id}">${a.account_code} - ${a.account_name}</option>`).join('')}
      </select>
    </div>
  `, async () => {
    const name  = document.getElementById('f-katNama').value.trim();
    const icon  = document.getElementById('f-katIkon').value.trim();
    const coa_id = document.getElementById('f-katCOA').value || null;
    if (!name) return;
    await SB.expense_categories.insert({ name, icon, coa_id });
    showToast('success','Berhasil','Kategori ditambahkan');
    loadMetadata();
  });
};

window.openAddSatuanModal = function() {
  openModal('Tambah Satuan', `
    <div class="form-group"><label class="form-label">Nama Satuan</label><input class="form-control" id="f-satNama" placeholder="Contoh: sak"></div>
    <div class="form-group"><label class="form-label">Gunakan Untuk</label>
      <select class="form-control" id="f-satType">
        <option value="semua">Semua Modul</option>
        <option value="panen">Hanya Panen</option>
        <option value="biaya">Hanya Biaya</option>
      </select>
    </div>
  `, async () => {
    const name = document.getElementById('f-satNama').value.trim();
    const type = document.getElementById('f-satType').value;
    if (!name) return;
    await SB.units.insert({ name, type });
    showToast('success','Berhasil','Satuan ditambahkan');
    loadMetadata();
  });
};

window.deleteKat = async function(id) {
  if (!confirm('Hapus kategori ini?')) return;
  await SB.expense_categories.remove(id);
  loadMetadata();
};

window.deleteSatuan = async function(id) {
  if (!confirm('Hapus satuan ini?')) return;
  await SB.units.remove(id);
  loadMetadata();
};

// --- Override original renderProfil function to ensure metadata loads ---
if (typeof window._originalRenderProfil === 'undefined') {
  window._originalRenderProfil = renderProfil;
  renderProfil = async function() {
    const html = await window._originalRenderProfil();
    // Load metadata shortly after HTML is injected into DOM
    setTimeout(loadMetadata, 100);
    return html;
  };
}
