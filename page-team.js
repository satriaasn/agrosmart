/* =============================================
   AgroSmart — Page: Tim & Operator Management
   Diakses oleh: owner (kelola tim mereka)
   ============================================= */

function renderTim() {
  const currentUser = window._currentUserId || null;
  return `
  <div class="page-header">
    <div>
      <div class="page-title">Manajemen Tim</div>
      <div class="page-subtitle">Undang operator, atur hak akses, dan kelola anggota tim perkebunan Anda.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="openInviteModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Undang Operator
      </button>
    </div>
  </div>

  <!-- Info banner untuk operator -->
  <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:14px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:flex-start;gap:12px">
    <span style="font-size:20px">🔐</span>
    <div>
      <div style="font-size:13px;font-weight:600;color:var(--text-accent);margin-bottom:4px">Manajemen Akses Operator</div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">
        Gunakan fitur ini untuk menambah anggota tim. Cukup masukkan email mereka dan berikan akses ke modul tertentu. 
        <br><strong style="color:var(--text-primary)">Baru:</strong> Sekarang operator cukup melakukan <b>Sign Up</b> dengan email yang sama untuk langsung terhubung ke bisnis Anda.
      </div>
    </div>
  </div>

  <!-- Team list -->
  <div id="timGrid" style="display:flex;flex-direction:column;gap:12px">
    <div style="text-align:center;padding:32px;color:var(--text-muted)">⏳ Memuat anggota tim...</div>
  </div>`;
}

// ── Load team members ────────────────────────────────────────────────────────
async function loadTimData() {
  const userId = window._currentUserId;
  if (!userId) return;

  const { data, error } = await SB.team.fetch(userId);
  const grid = document.getElementById('timGrid');
  if (!grid) return;

  if (error) {
    grid.innerHTML = `<div style="color:#fca5a5;font-size:13px;padding:16px">Gagal memuat: ${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = `
      <div style="text-align:center;padding:48px;color:var(--text-muted)">
        <div style="font-size:40px;margin-bottom:12px">👥</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px">Belum ada anggota tim</div>
        <div style="font-size:12px">Klik "Undang Operator" untuk mulai menambah tim Anda.</div>
      </div>`;
    return;
  }

  grid.innerHTML = data.map(m => memberCard(m)).join('');
}

function memberCard(m) {
  const perms = m.permissions || {};
  const statusColor = m.status === 'active' ? 'badge-green' : m.status === 'pending' ? 'badge-amber' : 'badge-red';
  const statusLabel = m.status === 'active' ? 'Aktif' : m.status === 'pending' ? 'Belum Login' : 'Dinonaktifkan';

  const modules = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'lahan',     label: 'Lahan' },
    { key: 'tanaman',   label: 'Tanaman' },
    { key: 'karyawan',  label: 'Karyawan' },
    { key: 'panen',     label: 'Panen' },
    { key: 'keuangan',  label: 'Keuangan' },
    { key: 'laporan',   label: 'Laporan' },
    { key: 'peta',      label: 'Peta' },
    { key: 'cuaca',     label: 'Cuaca' },
    { key: 'edit',      label: 'Bisa Edit' },
    { key: 'hapus',     label: 'Bisa Hapus' },
  ];

  return `
  <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:20px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--accent-primary),var(--accent-dark));display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0">
          ${(m.invited_email[0] || '?').toUpperCase()}
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--text-primary)">${m.role_label}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${m.invited_email}</div>
          <div style="margin-top:6px;display:flex;gap:6px">
            <span class="badge ${statusColor}" style="font-size:10px"><span class="badge-dot"></span>${statusLabel}</span>
            ${m.status === 'pending' ? `<span class="badge badge-amber" style="font-size:10px">⏳ Menunggu Aktivasi User</span>` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="openPermissionModal('${m.id}')">⚙️ Permission</button>
        ${m.status === 'active'
          ? `<button class="btn btn-danger btn-sm" onclick="suspendMember('${m.id}')">🚫 Suspend</button>`
          : m.status === 'suspended'
            ? `<button class="btn btn-sm" style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:var(--text-accent)" onclick="activateMember('${m.id}')">✅ Aktifkan</button>`
            : ''}
        <button class="btn btn-danger btn-sm" onclick="removeMember('${m.id}')">🗑️</button>
      </div>
    </div>

    <!-- Permission toggles -->
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;margin-bottom:10px">HAK AKSES MODUL</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${modules.map(mod => `
          <div style="display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:99px;background:${perms[mod.key] ? 'rgba(16,185,129,0.12)' : 'var(--bg-input)'};border:1px solid ${perms[mod.key] ? 'rgba(16,185,129,0.3)' : 'var(--border)'};font-size:11px;font-weight:600;color:${perms[mod.key] ? 'var(--text-accent)' : 'var(--text-muted)'}">
            <span style="width:7px;height:7px;border-radius:50%;background:${perms[mod.key] ? 'var(--accent-primary)' : 'var(--border-strong)'}"></span>
            ${mod.label}
          </div>`).join('')}
      </div>
    </div>
    <!-- Assigned Lahan -->
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;margin-bottom:8px">AKSES LAHAN</div>
      <div style="font-size:12px;color:var(--text-secondary)">
        ${(() => {
          const assigned = m.assigned_lahan || [];
          if (assigned.length === 0) return '🔓 <i>Semua Lahan (Akses Penuh)</i>';
          return '📍 Terbatas pada: ' + assigned.length + ' Lahan';
        })()}
      </div>
    </div>

    <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">
      Ditambahkan: ${new Date(m.created_at).toLocaleDateString('id-ID')}
    </div>
  </div>`;
}

// ── Invite Operator ───────────────────────────────────────────────────────────
async function openInviteModal() {
  const { data: lahanList } = await SB.lahan.fetch(window._currentUserId);
  
  openModal('Undang Operator Baru', `
    <div class="form-group">
      <label class="form-label">Email Operator</label>
      <input class="form-control" id="f-iEmail" type="email" placeholder="operator@email.com">
      <div style="font-size:11px;color:var(--text-muted);margin-top:5px">Minta mereka register dulu di halaman login dengan email ini.</div>
    </div>
    <div class="form-group">
      <label class="form-label">Password Sementara</label>
      <input class="form-control" id="f-iPassword" type="text" placeholder="Min. 8 karakter">
    </div>
    <div class="form-group">
      <label class="form-label">Label Peran / Jabatan</label>
      <input class="form-control" id="f-iRole" placeholder="cth. Manajer Kebun, Supervisor">
    </div>

    <!-- Land Assignment -->
    <div style="border-top:1px solid var(--border);margin:16px 0;padding-top:16px">
      <div style="font-size:12px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:12px">📍 PENUGASAN LAHAN</div>
      <div class="grid-2" style="gap:8px">
        ${(lahanList || []).map(l => `
          <label style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;background:var(--bg-input);border:1px solid var(--border);cursor:pointer">
            <input type="checkbox" class="f-assigned-lahan" value="${l.id}" style="width:14px;height:14px">
            <span style="font-size:12px;color:var(--text-secondary)">${l.nama}</span>
          </label>
        `).join('')}
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:8px">Kosongkan untuk akses ke SEMUA lahan.</div>
    </div>

    <div style="border-top:1px solid var(--border);margin:16px 0;padding-top:16px">
      <div style="font-size:12px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:12px">⚙️ HAK AKSES AWAL</div>
      <div class="grid-2" style="gap:10px">
        ${[
          { key:'dashboard', label:'Dashboard', defOn:true },
          { key:'lahan',     label:'Lahan',     defOn:true },
          { key:'tanaman',   label:'Tanaman',   defOn:true },
          { key:'karyawan',  label:'Karyawan',  defOn:true },
          { key:'panen',     label:'Panen',     defOn:true },
          { key:'keuangan',  label:'Keuangan',  defOn:false },
          { key:'laporan',   label:'Laporan',   defOn:true },
          { key:'cuaca',     label:'Cuaca',     defOn:true },
          { key:'peta',      label:'Peta Lahan',defOn:true },
          { key:'edit',      label:'✏️ Edit Data',defOn:true },
          { key:'hapus',     label:'🗑️ Hapus Data',defOn:false },
        ].map(p => `
          <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:var(--bg-input);border:1px solid var(--border);cursor:pointer">
            <input type="checkbox" id="fp-${p.key}" ${p.defOn?'checked':''} style="accent-color:var(--accent-primary);width:14px;height:14px">
            <span style="font-size:12px;font-weight:600;color:var(--text-secondary)">${p.label}</span>
          </label>`).join('')}
      </div>
    </div>
  `, async () => {
    const email = document.getElementById('f-iEmail').value.trim().toLowerCase();
    const password = document.getElementById('f-iPassword').value.trim();
    const role  = document.getElementById('f-iRole').value.trim() || 'Operator';
    
    if (!email) { showToast('danger','Gagal','Email tidak boleh kosong.'); return; }
    if (!password || password.length < 8) { showToast('danger','Gagal','Password minimal 8 karakter.'); return; }

    const pKeys = ['dashboard','lahan','tanaman','karyawan','panen','keuangan','laporan','cuaca','peta','edit','hapus'];
    const permissions = {};
    pKeys.forEach(k => { permissions[k] = document.getElementById(`fp-${k}`)?.checked ?? false; });
    
    const assignedLahan = Array.from(document.querySelectorAll('.f-assigned-lahan:checked')).map(el => parseInt(el.value));

    const { error } = await SB.team.invite({
      owner_id: window._currentUserId,
      invited_email: email,
      temp_password: password,
      role_label: role,
      permissions,
      assigned_lahan: assignedLahan,
      status: 'pending',
    });

    if (error) {
      const msg = error.message.includes('unique') ? 'Email ini sudah diundang sebelumnya.' : error.message;
      showToast('danger','Gagal',msg);
      return;
    }
    showToast('success','Berhasil',`Operator ${email} berhasil diundang.`);
    await loadTimData();
  });
}

// ── Edit Permission ───────────────────────────────────────────────────────────
async function openPermissionModal(memberId) {
  const { data: members } = await SB.team.fetch(window._currentUserId);
  const m = members?.find(x => x.id === memberId);
  if (!m) return;

  const { data: lahanList } = await SB.lahan.fetch(window._currentUserId);
  const perms = m.permissions || {};
  const assigned = m.assigned_lahan || [];

  const pKeys = [
    { key:'dashboard', label:'Dashboard' },
    { key:'lahan',     label:'Lahan' },
    { key:'tanaman',   label:'Tanaman' },
    { key:'karyawan',  label:'Karyawan' },
    { key:'panen',     label:'Panen' },
    { key:'keuangan',  label:'Keuangan' },
    { key:'laporan',   label:'Laporan' },
    { key:'cuaca',     label:'Cuaca' },
    { key:'peta',      label:'Peta Lahan' },
    { key:'edit',      label:'✏️ Edit Data' },
    { key:'hapus',     label:'🗑️ Hapus Data' },
  ];

  openModal(`Permission: ${m.invited_email}`, `
    <div style="margin-bottom:12px">
      <label class="form-label">Label Peran</label>
      <input class="form-control" id="ep-roleLabel" value="${m.role_label}">
    </div>

    <!-- Land Assignment -->
    <div style="border-top:1px solid var(--border);margin:16px 0;padding-top:16px">
      <div style="font-size:12px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:12px">📍 PENUGASAN LAHAN</div>
      <div class="grid-2" style="gap:8px">
        ${(lahanList || []).map(l => `
          <label style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;background:var(--bg-input);border:1px solid var(--border);cursor:pointer">
            <input type="checkbox" class="ep-assigned-lahan" value="${l.id}" ${assigned.includes(l.id) ? 'checked' : ''} style="width:14px;height:14px">
            <span style="font-size:12px;color:var(--text-secondary)">${l.nama}</span>
          </label>
        `).join('')}
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:8px">Kosongkan semua untuk akses ke SELURUH lahan.</div>
    </div>

    <div style="border-top:1px solid var(--border);margin:16px 0;padding-top:16px">
      <div style="font-size:12px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:12px">⚙️ HAK AKSES</div>
      <div class="grid-2" style="gap:10px">
        ${pKeys.map(p => `
          <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:var(--bg-input);border:1px solid var(--border);cursor:pointer">
            <input type="checkbox" id="ep-${p.key}" ${perms[p.key]?'checked':''} style="accent-color:var(--accent-primary);width:14px;height:14px">
            <span style="font-size:12px;font-weight:600;color:var(--text-secondary)">${p.label}</span>
          </label>`).join('')}
      </div>
    </div>
  `, async () => {
    const newPerms = {};
    pKeys.forEach(p => { newPerms[p.key] = document.getElementById(`ep-${p.key}`)?.checked ?? false; });
    const roleLabel = document.getElementById('ep-roleLabel').value.trim() || m.role_label;
    
    const newAssigned = Array.from(document.querySelectorAll('.ep-assigned-lahan:checked')).map(el => parseInt(el.value));

    const { error } = await SB.team.update(memberId, { 
      permissions: newPerms, 
      role_label: roleLabel,
      assigned_lahan: newAssigned 
    });
    if (error) { showToast('danger','Gagal',error.message); return; }
    showToast('success','Berhasil','Permission & Penugasan diperbarui.');
    await loadTimData();
  });
}

// ── Suspend / Activate / Remove ───────────────────────────────────────────────
async function suspendMember(id) {
  if (!confirm('Yakin suspend operator ini? Mereka tidak bisa akses data.')) return;
  const { error } = await SB.team.suspend(id);
  if (error) { showToast('danger','Gagal',error.message); return; }
  showToast('success','Suspended','Operator dinonaktifkan.');
  await loadTimData();
}

async function activateMember(id) {
  const { error } = await SB.team.activate(id);
  if (error) { showToast('danger','Gagal',error.message); return; }
  showToast('success','Aktif','Operator diaktifkan kembali.');
  await loadTimData();
}

async function removeMember(id) {
  if (!confirm('Yakin hapus operator ini permanen?')) return;
  const { error } = await SB.team.remove(id);
  if (error) { showToast('danger','Gagal',error.message); return; }
  showToast('success','Dihapus','Operator telah dihapus dari tim.');
  await loadTimData();
}
