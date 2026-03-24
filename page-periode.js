/* =============================================
   AgroSmart — Modul Periode Tanam
   ============================================= */

let allSeasons = [];

async function renderPeriode() {
  // Panggil loadPeriodeData setelah DOM diupdate oleh app.js
  setTimeout(loadPeriodeData, 50);

  return `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h2 class="page-title">Siklus & Periode Tanam</h2>
        <p style="color:var(--text-secondary);font-size:14px;margin-top:4px;">Kelola siklus masa tanam untuk memisahkan data laporan per periode.</p>
      </div>
      <button class="btn btn-primary" onclick="openPeriodeModal()" style="display:flex;align-items:center;gap:6px">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Buat Periode Baru
      </button>
    </div>
    
    <div id="periodeList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px; margin-top:20px;">
      <div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-secondary)">
        <span class="spinner"></span> Memuat data...
      </div>
    </div>
  `;
}

async function loadPeriodeData() {
  const listEl = document.getElementById('periodeList');
  if (!listEl) return;

  const { data, error } = await SB.seasons.fetch();
  if (error) {
    showToast('danger', 'Error', error.message);
    listEl.innerHTML = `<div class="alert alert-danger" style="grid-column:1/-1">Gagal memuat data periode: ${error.message}</div>`;
    return;
  }

  allSeasons = data || [];
  
  // Set global active season
  const active = allSeasons.find(s => s.status === 'aktif');
  window.APP_SEASON = active || null;
  window.APP_SEASON_ID = active ? active.id : null;
  
  // Update header banner if function exists
  if (typeof updateSeasonBanner === 'function') updateSeasonBanner();

  if (allSeasons.length === 0) {
    listEl.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 20px; background:var(--surface); border-radius:12px; border:1px dashed var(--border);">
        <div style="font-size:48px; margin-bottom:16px;">🌱</div>
        <h3 style="margin:0 0 8px 0; color:var(--text-primary);">Belum Ada Periode Tanam</h3>
        <p style="color:var(--text-secondary); font-size:14px; max-width:400px; margin:0 auto 20px;">Buka periode tanam baru untuk mulai mencatat semua aktivitas, biaya, dan hasil panen untuk musim ini.</p>
        <button class="btn btn-primary" onclick="openPeriodeModal()">Buat Periode Sekarang</button>
      </div>`;
    return;
  }

  listEl.innerHTML = allSeasons.map(s => {
    const isActive = s.status === 'aktif';
    const isOwner = window.APP_ROLE === 'owner' || window.APP_ROLE === 'superadmin';
    
    // Hitung durasi
    const start = new Date(s.tanggal_mulai);
    const end = s.tanggal_selesai ? new Date(s.tanggal_selesai) : new Date();
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    return `
      <div class="card" style="padding:20px; border-left:4px solid ${isActive ? 'var(--primary)' : 'var(--text-muted)'}; display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h3 style="margin:0 0 4px 0; font-size:18px; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
              ${s.nama}
              ${isActive ? '<span class="badge" style="background:rgba(16,185,129,0.1);color:#10b981;">Aktif</span>' : '<span class="badge" style="background:var(--bg);color:var(--text-muted);">Selesai</span>'}
            </h3>
            <div style="font-size:13px; color:var(--text-secondary);">
              ${start.toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})} — 
              ${s.tanggal_selesai ? new Date(s.tanggal_selesai).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : 'Sekarang'}
              (${days} hari)
            </div>
          </div>
          ${isOwner ? `
            <div style="display:flex; gap:6px;">
              <button class="btn btn-ghost" style="padding:4px 8px; font-size:12px;" onclick="openPeriodeModal(${s.id})">Edit</button>
            </div>
          ` : ''}
        </div>
        
        <div style="font-size:14px; color:var(--text-secondary); line-height:1.5;">
          ${s.deskripsi || '<i style="opacity:0.6">Tidak ada deskripsi</i>'}
        </div>
        
        <div style="margin-top:auto; padding-top:16px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
          ${isActive ? `
            <div style="font-size:12px; color:var(--text-secondary);">Sedang berjalan...</div>
            ${isOwner ? `<button class="btn" style="background:rgba(239,68,68,0.1); color:#ef4444; border:none; font-size:13px; padding:6px 12px;" onclick="tutupPeriode(${s.id}, '${s.nama.replace(/'/g,"\\'")}')">Tutup Periode</button>` : ''}
          ` : `
            <div>
              <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Laba Bersih</div>
              <div style="font-size:16px; font-weight:700; color:${(s.total_panen||0) >= (s.total_biaya||0) ? 'var(--primary-light)' : '#ef4444'}">
                Rp ${((s.total_panen||0) - (s.total_biaya||0)).toLocaleString('id-ID')}
              </div>
            </div>
            <button class="btn btn-ghost" style="font-size:13px; padding:6px 12px; color:var(--primary-light)" onclick="showRingkasan(${s.id})">Detail Laporan</button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

// ─── Modal Tambah/Edit ────────────────────────────────────────────────────────

function openPeriodeModal(id = null) {
  const s = id ? allSeasons.find(x => x.id === id) : null;
  const isEdit = !!s;
  
  const today = new Date().toISOString().split('T')[0];

  const html = `
    <div class="form-row">
      <input type="hidden" id="pId" value="${s?.id || ''}">
      <div class="form-group" style="flex:2">
        <label class="form-label">Nama Periode *</label>
        <input class="form-control" type="text" id="pNama" placeholder="Cth: Musim Kemarau 2025" value="${s?.nama || ''}" required>
      </div>
      <div class="form-group" style="flex:1">
        <label class="form-label">Tanggal Mulai *</label>
        <input class="form-control" type="date" id="pStart" value="${s ? s.tanggal_mulai : today}" required>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Deskripsi (Opsional)</label>
      <textarea class="form-control" id="pDesc" rows="3" placeholder="Target, kondisi cuaca, atau catatan khusus...">${s?.deskripsi || ''}</textarea>
    </div>
    ${isEdit && s.status === 'selesai' ? `
      <div class="alert alert-warning" style="margin-top:8px;">
        Periode ini sudah ditutup. Mengubah detail tidak akan mengubah total pendapatan/biaya yang sudah dikunci.
      </div>
    ` : ''}
  `;

  openModal(isEdit ? 'Edit Periode' : 'Buat Periode Baru', html, savePeriode);
}

async function savePeriode() {
  const id = document.getElementById('pId').value;
  const nama = document.getElementById('pNama').value.trim();
  const tanggal_mulai = document.getElementById('pStart').value;
  const deskripsi = document.getElementById('pDesc').value.trim();

  if (!nama || !tanggal_mulai) throw new Error('Nama dan Tanggal Mulai wajib diisi.');

  const payload = { nama, tanggal_mulai, deskripsi };

  if (id) {
    const { error } = await SB.seasons.update(id, payload);
    if (error) throw error;
    showToast('success', 'Tersimpan', 'Data periode berhasil diperbarui.');
  } else {
    // Cek apakah ada periode aktif lain
    const activeExists = allSeasons.some(x => x.status === 'aktif');
    if (activeExists) {
      if (!confirm('Anda masih memiliki periode tanam yang statusnya AKTIF. Apakah Anda yakin ingin membuat periode baru?\n\n(Tip: Biasanya hanya 1 periode yang aktif dalam satu waktu)')) {
        return; // Cancel
      }
    }
    
    const { error } = await SB.seasons.insert(payload);
    if (error) throw error;
    showToast('success', 'Berhasil', 'Periode tanam baru telah dibuat.');
    
    // Catat log
    SB.admin?.logActivity('Buat Periode Tanam', `Periode baru: ${nama}`);
  }

  await loadPeriodeData();
}

// ─── Tutup Periode (RPC) ──────────────────────────────────────────────────────

async function tutupPeriode(id, nama) {
  if (!confirm(`TUTUP PERIODE "${nama}"?\n\nSistem akan mengkalkulasi total pengeluaran dan pendapatan hingga hari ini, lalu menguncinya.\nAnda tidak bisa menambahkan data baru ke periode yang sudah ditutup.\n\nLanjutkan?`)) return;

  try {
    const { data: res, error } = await SB.seasons.close(id);
    if (error) throw error;

    if (!res.success) throw new Error(res.message);

    showToast('success', 'Periode Ditutup', `Laba bersih: Rp ${Number(res.laba_bersih).toLocaleString('id-ID')}`);
    
    SB.admin?.logActivity('Tutup Periode', `Periode ${nama} ditutup dengan laba/rugi Rp ${Number(res.laba_bersih).toLocaleString('id-ID')}`);

    await loadPeriodeData();
    showRingkasan(id); // Langsung buka struk
  } catch (err) {
    showToast('danger', 'Gagal Tutup Periode', err.message);
  }
}

// ─── Laporan Ringkasan ────────────────────────────────────────────────────────

function showRingkasan(id) {
  const s = allSeasons.find(x => x.id === id);
  if (!s) return;

  const p = Number(s.total_panen) || 0;
  const b = Number(s.total_biaya) || 0;
  const lb = p - b;
  const roi = b > 0 ? ((lb / b) * 100).toFixed(1) : 0;
  
  const start = new Date(s.tanggal_mulai).toLocaleDateString('id-ID');
  const end = s.tanggal_selesai ? new Date(s.tanggal_selesai).toLocaleDateString('id-ID') : 'Belum ditutup';

  const html = `
    <div style="padding:10px; text-align:center;">
      <h2 style="margin:0; font-size:24px; color:var(--text-primary);">${s.nama}</h2>
      <div style="font-size:13px; color:var(--text-secondary); margin-bottom:24px;">${start} — ${end}</div>
      
      <div style="background:var(--bg); border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:16px; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px dashed var(--border);">
          <span style="color:var(--text-secondary);">Total Pendapatan Panen</span>
          <span style="font-weight:600; color:var(--primary-light);">Rp ${p.toLocaleString('id-ID')}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid var(--border);">
          <span style="color:var(--text-secondary);">Total Biaya Operasional</span>
          <span style="font-weight:600; color:#ef4444;">- Rp ${b.toLocaleString('id-ID')}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:18px;">
          <span style="font-weight:700; color:var(--text-primary);">Laba Bersih</span>
          <span style="font-weight:800; color:${lb >= 0 ? 'var(--primary-light)' : '#ef4444'};">Rp ${lb.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      <div style="margin-top:20px; display:flex; gap:16px; justify-content:center;">
        <div style="background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:12px 24px;">
          <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px;">ROI (Return on Investment)</div>
          <div style="font-size:18px; font-weight:700; color:${roi >= 0 ? '#10b981' : '#ef4444'};">${roi}%</div>
        </div>
      </div>
    </div>
  `;

  // Provide no onSave callback so only "Batal" (or Close) button is shown
  openModal('Laporan Akhir Musim', html);
  const cancelBtn = document.getElementById('modalCancel');
  if (cancelBtn) {
    cancelBtn.textContent = 'Tutup';
    cancelBtn.className = 'btn btn-primary';
  }
}
