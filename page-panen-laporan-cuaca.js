/* =============================================
   AgroSmart — Pages: Panen, Laporan, Cuaca
   ============================================= */

/* ---- PANEN ---- */
window._panenSeasonFilter = window._panenSeasonFilter || 'active'; // 'all', 'active' atau ID periode

async function renderPanen() {
  const { data: listPanen } = await SB.panen.fetch();
  const { data: listUnits } = await SB.units.fetch('panen');
  window._DYNAMIC_SATS_PANEN = listUnits || [];
  let arrPanen = listPanen || [];
  
  if (window._panenSeasonFilter === 'active' && window.APP_SEASON_ID) {
    arrPanen = arrPanen.filter(p => String(p.season_id) === String(window.APP_SEASON_ID));
  } else if (window._panenSeasonFilter !== 'all' && window._panenSeasonFilter !== 'active') {
    arrPanen = arrPanen.filter(p => String(p.season_id) === String(window._panenSeasonFilter));
  }
  
  const MULTIPLIERS = { 'kg': 1, 'ton': 1000, 'kwintal': 100, 'gram': 0.001, 'liter': 1, 'buah': 1, 'ikat': 1 };
  
  const totalKg = arrPanen.reduce((a, p) => {
    const mult = (window.APP_MULTIPLIERS || MULTIPLIERS)[(p.satuan || 'kg').toLowerCase()] || 1;
    return a + ((p.jumlah || 0) * mult);
  }, 0);

  const totalRp  = arrPanen.reduce((a,p) => a + (p.total||0), 0);
  const avgKg    = arrPanen.length ? Math.round(totalKg / arrPanen.length) : 0;

  const displayTotal = totalKg >= 1000 ? (totalKg/1000).toFixed(1) : totalKg.toLocaleString('id-ID');
  const unitTotal = totalKg >= 1000 ? 'ton' : 'kg';
  
  const displayAvg = avgKg >= 1000 ? (avgKg/1000).toFixed(1) : avgKg.toLocaleString('id-ID');
  const unitAvg = avgKg >= 1000 ? 'ton' : 'kg';
  return `
  <div class="page-header" style="flex-direction:row; justify-content:space-between; align-items:flex-end;">
    <div>
      <div class="page-title">Catatan Panen</div>
      <div class="page-subtitle">Rekap seluruh kegiatan panen dan hasil produksi.</div>
    </div>
    <div class="page-actions" style="display:flex; gap:12px; align-items:center;">
      <select class="form-control" style="width:160px" onchange="window._panenSeasonFilter=this.value; navigate('panen')">
        <option value="all" ${window._panenSeasonFilter==='all'?'selected':''}>Semua Periode</option>
        ${window.APP_SEASON ? `<option value="active" ${window._panenSeasonFilter==='active'?'selected':''}>Periode Aktif: ${window.APP_SEASON.nama}</option>` : ''}
        <!-- Bisa ditambah list semua periode jika allSeasons didefinisikan secara global, sementara pakai 2 ini dulu -->
      </select>
      ${canAccess('panen', 'add') ? `
      <button class="btn btn-primary" onclick="openPanenModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Catat Panen
      </button>` : ''}
    </div>
  </div>
  <div class="stats-grid" style="margin-bottom:22px">
    <div class="stat-card" style="--card-accent:#22c55e">
      <div class="stat-header"><span class="stat-label">Total Panen</span><div class="stat-icon-wrapper">📦</div></div>
      <div class="stat-value">${displayTotal}<span class="stat-unit">${unitTotal}</span></div>
    </div>
    <div class="stat-card" style="--card-accent:#10b981">
      <div class="stat-header"><span class="stat-label">Total Pendapatan</span><div class="stat-icon-wrapper">💰</div></div>
      <div class="stat-value">Rp <span style="font-size:22px">${(totalRp/1000000).toFixed(1)}jt</span></div>
    </div>
    <div class="stat-card" style="--card-accent:#f59e0b">
      <div class="stat-header"><span class="stat-label">Rata-rata / Panen</span><div class="stat-icon-wrapper">📊</div></div>
      <div class="stat-value">${displayAvg}<span class="stat-unit">${unitAvg}</span></div>
    </div>
    <div class="stat-card" style="--card-accent:#3b82f6">
      <div class="stat-header"><span class="stat-label">Total Sesi Panen</span><div class="stat-icon-wrapper">🗓️</div></div>
      <div class="stat-value">${arrPanen.length}<span class="stat-unit">sesi</span></div>
    </div>
  </div>
  <div class="card">
    <div class="section-title">Riwayat Panen</div>
    <div class="table-wrapper">
      <table>
        <thead><tr><th>Tanaman</th><th>Blok</th><th>Tanggal</th><th>Jumlah</th><th>Kualitas</th><th>Harga Satuan</th><th>Total</th><th>Karyawan</th><th>Aksi</th></tr></thead>
        <tbody>
          ${arrPanen.map(p => `
            <tr>
              <td><strong>${p.tanaman}</strong></td>
              <td>${p.lahan}</td>
              <td>${new Date(p.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</td>
              <td><span class="harvest-amount">${(p.jumlah||0).toLocaleString('id-ID')} ${p.satuan||'kg'}</span></td>
              <td><span class="badge ${p.kualitas==='A'?'badge-green':'badge-yellow'}">${p.kualitas||'-'}</span></td>
              <td>
                <div style="font-size:13px;font-weight:600">Rp ${(p.harga_raw || p.harga || 0).toLocaleString('id-ID')}</div>
                <div style="font-size:10px;color:var(--text-secondary)">/ ${p.multiplier_label === 'per_kg' ? 'kg' : (p.satuan || 'unit')}</div>
              </td>
              <td style="font-weight:600;color:var(--green-400)">Rp ${(p.total||0).toLocaleString('id-ID')}</td>
              <td style="font-size:12px;color:var(--text-secondary)">${p.karyawan||'-'}</td>
              <td>
                <div style="display:flex;gap:6px">
                  ${canAccess('panen', 'edit') ? `<button class="btn btn-sm btn-secondary" onclick="editPanen('${p.id}')">Edit</button>` : ''}
                  ${canAccess('panen', 'delete') ? `<button class="btn btn-sm btn-danger" onclick="deletePanen('${p.id}')">Hapus</button>` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function openPanenModal(id) {
  const [{ data: listPanen }, { data: listTanaman }, { data: listLahan }, { data: listKaryawan }, { data: listCOA }] = await Promise.all([
    SB.panen.fetch(),
    SB.tanaman.fetch(),
    SB.lahan.fetch(),
    SB.karyawan.fetch(),
    SB.coa.fetch()
  ]);
  const arrPanen    = listPanen    || [];
  const arrTanaman  = listTanaman  || [];
  const arrLahan    = listLahan    || [];
  const arrKaryawan = listKaryawan || [];
  const arrCOA      = (listCOA || []).filter(a => !a.is_header && a.account_type === 'Revenue');

  // Simpan data tanaman semua ke window agar bisa diakses cascade handler
  window._allTanaman = arrTanaman;

  let p = null;
  if (id) p = arrPanen.find(x => String(x.id) === String(id));

  // Tentukan lahan yang dipilih (untuk edit: lahan dari data, untuk add: lahan pertama)
  const selectedLahan = p?.lahan || (arrLahan[0]?.nama || '');

  // Fungsi build options tanaman difilter berdasarkan lahan
  const getTanamanOptions = (lahanNama, selectedTanaman) => {
    const filtered = (window._allTanaman || []).filter(t => {
      // Parse lahan string: "Blok A, Blok B" -> ["Blok A", "Blok B"]
      const lands = t.lahan ? t.lahan.split(',').map(x => x.trim()) : [];
      return lands.includes(lahanNama);
    });
    if (filtered.length === 0) {
      return `<option value="">— Belum ada tanaman di lahan ini —</option>`;
    }
    return filtered.map(t =>
      `<option value="${t.nama}" ${selectedTanaman === t.nama ? 'selected' : ''}>${t.nama}${t.kategori ? ' ('+t.kategori+')' : ''}</option>`
    ).join('');
  };

  openModal(p ? 'Edit Catatan Panen' : 'Catat Hasil Panen', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Blok Lahan *</label>
        <select class="form-control" id="f-pLahan" onchange="cascadeTanamanByLahan(this.value)">
          ${arrLahan.map(l => `<option value="${l.nama}" ${selectedLahan === l.nama ? 'selected' : ''}>${l.nama}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Tanaman *
          <span id="tanamanHint" style="font-weight:400;font-size:11px;color:var(--accent-primary);margin-left:6px">▸ sesuai lahan terpilih</span>
        </label>
        <select class="form-control" id="f-pTan">
          ${getTanamanOptions(selectedLahan, p?.tanaman)}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Jumlah Panen *</label><input class="form-control" type="number" id="f-pJml" value="${p?.jumlah||''}" placeholder="0" min="0"></div>
      <div class="form-group">
        <label class="form-label">Satuan Panen</label>
        <select class="form-control" id="f-pSatuan">
          ${(window._DYNAMIC_SATS_PANEN||[]).map(s => `<option ${(p?.satuan||'kg')===s.name?'selected':''}>${s.name}</option>`).join('')}
          ${!(window._DYNAMIC_SATS_PANEN||[]).some(s=>s.name==='kg') ? '<option>kg</option>' : ''}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Tanggal Panen</label><input class="form-control" type="date" id="f-pTgl" value="${p?.tanggal || new Date().toISOString().slice(0,10)}"></div>
      <div class="form-group">
        <label class="form-label">Harga (Rp) *</label>
        <div style="display:flex;gap:4px">
            <input class="form-control" type="number" id="f-pHarga" value="${p?.harga_raw||p?.harga||''}" placeholder="0" min="0" style="flex:1">
            <select class="form-control" id="f-pHargaTipe" style="width:100px;font-size:11px">
                <option value="per_kg" ${p?.multiplier_label==='per_kg'?'selected':''}>/ kg</option>
                <option value="per_satuan" ${p?.multiplier_label==='per_satuan'?'selected':''}>/ unit panen</option>
            </select>
        </div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Kualitas</label>
        <select class="form-control" id="f-pKual">
          ${['Super','A','B','C'].map(k => `<option ${(p?.kualitas||'A')===k?'selected':''}>${k}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Akun COA (Pendapatan) *</label>
        <select class="form-control" id="f-pCOA">
          <option value="">— Pilih Akun Pendapatan —</option>
          ${arrCOA.map(a=>(`
            <option value="${a.id}" ${String(p?.coa_id)===String(a.id)?'selected':''}>
              [${a.account_code}] ${a.account_name}
            </option>
          `)).join('')}
        </select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Penanggung Jawab</label>
      <select class="form-control" id="f-pKary">
        <option value="">— Pilih karyawan —</option>
        ${arrKaryawan.map(k => `<option ${p?.karyawan===k.nama?'selected':''}>${k.nama}</option>`).join('')}
      </select>
    </div>
    <div id="previewTotal" style="margin-top:12px;padding:16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:14px;display:none">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Estimasi Total Pendapatan</div>
            <div id="previewTotalVal" style="font-size:24px;font-weight:800;color:var(--accent-primary);margin-top:2px">Rp 0</div>
        </div>
        <div id="previewBadge" class="badge badge-green" style="height:fit-content">Otomatis</div>
      </div>
      <div id="previewInfo" style="margin-top:8px;font-size:12px;color:var(--text-secondary);border-top:1px solid rgba(16,185,129,0.1);padding-top:8px"></div>
    </div>
    <style>
      #f-pJml, #f-pHarga { transition: border-color 0.2s; }
    </style>
  `, async () => {
    const jumlahInput = document.getElementById('f-pJml');
    const hargaInput  = document.getElementById('f-pHarga');
    const tanamanSelect = document.getElementById('f-pTan');
    const lahanSelect   = document.getElementById('f-pLahan');
    const tglInput      = document.getElementById('f-pTgl');
    const satuanSelect  = document.getElementById('f-pSatuan');
    const multiplierSelect = document.getElementById('f-pHargaTipe');
    const kualSelect    = document.getElementById('f-pKual');
    const karySelect    = document.getElementById('f-pKary');

    const jumlah = +jumlahInput.value;
    const rawHarga = +hargaInput.value;
    const tanaman = tanamanSelect.value;
    const lahan   = lahanSelect.value;
    const tanggal = tglInput.value;
    const satuan  = satuanSelect.value;
    const multiplierLabel = multiplierSelect.value || 'per_kg';

    const coa_id  = document.getElementById('f-pCOA').value;

    if (!lahan)   { showToast('warning','Gagal','Pilih blok lahan terlebih dahulu.'); return false; }
    if (!tanaman) { showToast('warning','Gagal','Pilih tanaman terlebih dahulu.'); return false; }
    if (!jumlah || jumlah <= 0) { showToast('warning','Gagal','Jumlah harus lebih dari 0.'); return false; }
    if (!rawHarga || rawHarga <= 0) { showToast('warning','Gagal','Harga harus lebih dari 0.'); return false; }
    if (!coa_id) { showToast('warning','Peringatan','Mohon pilih akun COA untuk pencatatan pendapatan.'); return false; }

    // Calculate effective price for database storage (which calculates total as jumlah * harga)
    const MULTIPLIERS = { 'kg': 1, 'ton': 1000, 'kwintal': 100, 'gram': 0.001, 'liter': 1, 'buah': 1, 'ikat': 1 };
    let effectiveHarga = rawHarga;
    if (multiplierLabel === 'per_kg') {
      const mult = MULTIPLIERS[satuan.toLowerCase()] || 1;
      effectiveHarga = rawHarga * mult;
    }

    const data = {
      tanaman,
      lahan,
      tanggal,
      jumlah,
      satuan,
      kualitas: kualSelect.value,
      harga:    effectiveHarga,
      multiplier_label: multiplierLabel,
      harga_raw: rawHarga, 
      karyawan: karySelect.value || null
      // coa_id removed to avoid 400 error (column missing in DB)
    };

    try {
      let savedPanen;
      if (p?.id) {
        const { data: res, error } = await SB.panen.update(p.id, data);
        if (error) throw error;
        savedPanen = res;
        showToast('success', 'Berhasil', 'Catatan panen diperbarui.');
      } else {
        const { data: res, error } = await SB.panen.insert(data);
        if (error) throw error;
        savedPanen = res;
        showToast('success', 'Berhasil', 'Catatan panen disimpan.');
      }

      // --- SYNC TO CASH BOOK ---
      if (savedPanen) {
        const totalRp = (parseFloat(savedPanen.jumlah) || 0) * (parseFloat(savedPanen.harga) || 0);
        const cashData = {
          tipe: 'masuk',
          tanggal: savedPanen.tanggal,
          jumlah: totalRp,
          kategori: 'Hasil Panen',
          coa_id: coa_id ? parseInt(coa_id) : null,
          lahan: lahan,
          deskripsi: `[Panen Lahan: ${lahan}] ${tanaman} (${savedPanen.jumlah} ${savedPanen.satuan})`,
          ref_id: savedPanen.id,
          ref_type: 'panen'
        };

        console.log('[DEBUG] Panen Syncing to Cash Book:', cashData);

        try {
          const { data: existingCash, error: fetchErr } = await sb.from('cash_book').select('id').eq('ref_id', savedPanen.id).eq('ref_type', 'panen').maybeSingle();
          if (fetchErr) console.warn('[DEBUG] Panen Sync Fetch Err:', fetchErr);
          
          let syncRes;
          if (existingCash) {
            syncRes = await SB.cash_book.update(existingCash.id, cashData);
          } else {
            syncRes = await SB.cash_book.insert(cashData);
          }

          if (syncRes.error) {
            // Retry without optional columns that may not exist in DB
            console.warn('[DEBUG] Panen Cash Book sync failed, retrying without optional columns:', syncRes.error.message);
            const fallbackData = { ...cashData };
            delete fallbackData.lahan;
            delete fallbackData.coa_id;
            delete fallbackData.season_id;

            if (existingCash) {
              syncRes = await SB.cash_book.update(existingCash.id, fallbackData);
            } else {
              syncRes = await SB.cash_book.insert(fallbackData);
            }

            if (syncRes.error) {
              console.error('[DEBUG] Panen Cash Book Sync Error (final):', syncRes.error);
              showToast('warning', 'Peringatan', 'Panen tersimpan, tapi sinkronisasi ke Buku Kas gagal. Jalankan migrasi database terbaru.');
            } else {
              showToast('info', 'Info', 'Kas tersinkron (tanpa kolom lahan). Jalankan migrasi DB untuk fitur lengkap.');
            }
          }
        } catch (syncErr) {
          console.error('[DEBUG] Panen Cash Book Sync Exception:', syncErr);
          showToast('warning', 'Peringatan', 'Panen tersimpan, tapi sinkron ke Buku Kas gagal.');
        }
      }

      navigate('panen');
    } catch (err) {
      console.error('[DEBUG] Panen CRUD Error Full:', err);
      throw err; // app.js handles showing toast
    }
  });

  // ─── Direct DOM Manipulation after Modal Opened ─────────────────────────────
  const jInput = document.getElementById('f-pJml');
  const hInput = document.getElementById('f-pHarga');
  const sSelect = document.getElementById('f-pSatuan');
  const tSelect = document.getElementById('f-pHargaTipe');
  const box = document.getElementById('previewTotal');
  const val = document.getElementById('previewTotalVal');
  const info = document.getElementById('previewInfo');

  function updatePreview() {
    if (!jInput || !hInput || !sSelect || !box || !val) return;
    const j = parseFloat(jInput.value || 0);
    const h = parseFloat(hInput.value || 0);
    const s = sSelect.value;
    const t = tSelect.value;
    const MULTIPLIERS = window.APP_MULTIPLIERS || { 'kg': 1, 'ton': 1000, 'kwintal': 100, 'gram': 0.001, 'liter': 1, 'buah': 1, 'ikat': 1 };

    if (j > 0 && h > 0) {
      let multiplier = 1;
      if (t === 'per_kg') multiplier = MULTIPLIERS[s.toLowerCase()] || 1;
      const total = j * h * multiplier;
      box.style.display = 'block';
      val.textContent = 'Rp ' + total.toLocaleString('id-ID');
      let detail = j.toLocaleString('id-ID') + ' ' + s + ' × Rp ' + h.toLocaleString('id-ID');
      if (t === 'per_kg' && multiplier > 1) {
        detail = j.toLocaleString('id-ID') + ' ' + s + ' (' + (j*multiplier).toLocaleString('id-ID') + ' kg) × Rp ' + h.toLocaleString('id-ID') + '/kg';
      } else if (t === 'per_kg') {
        detail = j.toLocaleString('id-ID') + ' ' + s + ' × Rp ' + h.toLocaleString('id-ID') + '/kg';
      } else {
        detail = j.toLocaleString('id-ID') + ' ' + s + ' × Rp ' + h.toLocaleString('id-ID') + '/' + s;
      }
      info.textContent = detail;
    } else {
      box.style.display = 'none';
    }
  }

  [jInput, hInput, sSelect, tSelect].forEach(el => {
    el?.addEventListener('input', updatePreview);
    el?.addEventListener('change', updatePreview);
  });
  updatePreview();
}

// ── Cascade: Filter Tanaman berdasarkan Lahan yang dipilih ────────────────────
window.cascadeTanamanByLahan = function(lahanNama) {
  const select = document.getElementById('f-pTan');
  if (!select) return;

  const filtered = (window._allTanaman || []).filter(t => {
    const lands = t.lahan ? t.lahan.split(',').map(x => x.trim()) : [];
    return lands.includes(lahanNama);
  });

  if (filtered.length === 0) {
    select.innerHTML = `<option value="">— Belum ada tanaman di lahan ini —</option>`;
    select.style.borderColor = 'var(--red-500)';
    const hint = document.getElementById('tanamanHint');
    if (hint) hint.textContent = '⚠ tidak ada data tanaman';
  } else {
    select.innerHTML = filtered
      .map(t => `<option value="${t.nama}">${t.nama}${t.kategori ? ' ('+t.kategori+')' : ''}</option>`)
      .join('');
    select.style.borderColor = '';
    const hint = document.getElementById('tanamanHint');
    if (hint) hint.textContent = `▸ ${filtered.length} tanaman di lahan ini`;
  }
};

function editPanen(id)  { openPanenModal(id); }
async function deletePanen(id) {
  if (!confirm('Yakin hapus catatan panen ini? Transaksi di Buku Kas juga akan dihapus.')) return;
  
  // Delete linked cash book entry first
  await sb.from('cash_book').delete().eq('ref_id', id).eq('ref_type', 'panen');
  
  await SB.panen.remove(id);
  showToast('success', 'Dihapus', 'Catatan panen dan transaksi kas dihapus.');
  navigate('panen');
}


/* ---- LAPORAN ---- */
window._laporanSeasonFilter = window._laporanSeasonFilter || 'active'; // 'all', 'active' atau ID periode

async function renderLaporan() {
  const [{ data: listPanen }, { data: listKaryawan }, { data: listLahan }, { data: listKas }] = await Promise.all([
    SB.panen.fetch(),
    SB.karyawan.fetch(),
    SB.lahan.fetch(),
    SB.cash_book.fetch()
  ]);
  let arrPanen = listPanen || [];
  const arrKaryawan = listKaryawan || [];
  const arrLahan = listLahan || [];
  let arrKas = listKas || [];

  if (window._laporanSeasonFilter === 'active' && window.APP_SEASON_ID) {
    arrPanen = arrPanen.filter(p => String(p.season_id) === String(window.APP_SEASON_ID));
    // Asumsi cash_book yang tercatat lewat modul biaya/panen otomatis nempel season_id via ref. Sementara cash_book murni mungkin tidak ada season_id. Kita tidak filter kas di sini untuk sementara agar uang tunai tetap cocok.
    // Atau jika ingin strict, buku kas juga filter season_id. Kita filter yang terkait ref_type 'panen'/'biaya' yg ada di periode ini.
    // Untuk simplifikasi:
    const activePanenIds = new Set(arrPanen.map(p=>p.id));
    // Harus fetch biaya yg aktif jg
    const { data: listBiaya } = await SB.biaya.fetch();
    const activeBiayaIds = new Set((listBiaya||[]).filter(b => String(b.season_id) === String(window.APP_SEASON_ID)).map(b=>b.id));
    
    arrKas = arrKas.filter(k => 
      (k.ref_type === 'panen' ? activePanenIds.has(k.ref_id) : 
      (k.ref_type === 'biaya' ? activeBiayaIds.has(k.ref_id) : true)) // Transaksi manual tetap masuk
    );
  } else if (window._laporanSeasonFilter !== 'all' && window._laporanSeasonFilter !== 'active') {
    arrPanen = arrPanen.filter(p => String(p.season_id) === String(window._laporanSeasonFilter));
    const { data: listBiaya } = await SB.biaya.fetch();
    const activeBiayaIds = new Set((listBiaya||[]).filter(b => String(b.season_id) === String(window._laporanSeasonFilter)).map(b=>b.id));
    const activePanenIds = new Set(arrPanen.map(p=>p.id));
    arrKas = arrKas.filter(k => 
      (k.ref_type === 'panen' ? activePanenIds.has(k.ref_id) : 
      (k.ref_type === 'biaya' ? activeBiayaIds.has(k.ref_id) : true))
    );
  }

  const totalKg = arrPanen.reduce((a, p) => {
    const mult = (window.APP_MULTIPLIERS || { 'kg': 1, 'ton': 1000 })[(p.satuan || 'kg').toLowerCase()] || 1;
    return a + ((p.jumlah || 0) * mult);
  }, 0);
  const totalLahanHa = arrLahan.reduce((a,l)=>a+(l.luas||0),0);
  const totalPendapatanPanen = arrPanen.reduce((a,p)=>a+(p.total||0),0);
  
  // Cash Flow Stats
  const cashMasuk = arrKas.filter(k=>k.tipe==='masuk').reduce((a,b)=>a+b.jumlah, 0);
  const cashKeluar = arrKas.filter(k=>k.tipe==='keluar').reduce((a,b)=>a+b.jumlah, 0);
  const netCashFlow = cashMasuk - cashKeluar;
  
  const displayTotal = totalKg >= 1000 ? (totalKg/1000).toFixed(1) + ' ton' : totalKg.toLocaleString('id-ID') + ' kg';

  return `
    <div class="page-header" style="flex-direction:row; justify-content:space-between; align-items:flex-end;">
      <div>
        <div class="page-title">Analisis Laba Rugi & Kas</div>
        <div class="page-subtitle">Perbandingan antara log operasional (panen) dan arus kas nyata.</div>
      </div>
      <div class="page-actions" style="display:flex; gap:12px; align-items:center;">
        <select class="form-control" style="width:160px" onchange="window._laporanSeasonFilter=this.value; navigate('laporan')">
          <option value="all" ${window._laporanSeasonFilter==='all'?'selected':''}>Semua Periode</option>
          ${window.APP_SEASON ? `<option value="active" ${window._laporanSeasonFilter==='active'?'selected':''}>Periode Aktif: ${window.APP_SEASON.nama}</option>` : ''}
        </select>
      </div>
    </div>
    
    <div class="stats-grid" style="margin-bottom:24px">
        <div class="stat-card" style="--card-accent:#10b981">
          <div class="stat-header"><span class="stat-label">Pendapatan Panen</span><div class="stat-icon-wrapper">💰</div></div>
          <div class="stat-value" style="font-size:22px">Rp ${totalPendapatanPanen.toLocaleString('id-ID')}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Berdasarkan log panen lapangan</div>
        </div>
        <div class="stat-card" style="--card-accent:#3b82f6">
          <div class="stat-header"><span class="stat-label">Arus Kas Masuk</span><div class="stat-icon-wrapper">📥</div></div>
          <div class="stat-value" style="font-size:22px">Rp ${cashMasuk.toLocaleString('id-ID')}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Uang nyata yang masuk ke kas</div>
        </div>
        <div class="stat-card" style="--card-accent:#ef4444">
          <div class="stat-header"><span class="stat-label">Arus Kas Keluar</span><div class="stat-icon-wrapper">📤</div></div>
          <div class="stat-value" style="font-size:22px">Rp ${cashKeluar.toLocaleString('id-ID')}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Uang nyata yang keluar dari kas</div>
        </div>
        <div class="stat-card" style="--card-accent:${netCashFlow < 0 ? '#ef4444' : '#14b8a6'}">
          <div class="stat-header"><span class="stat-label">Net Cash Flow</span><div class="stat-icon-wrapper">📊</div></div>
          <div class="stat-value" style="font-size:22px">Rp ${netCashFlow.toLocaleString('id-ID')}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Selisih uang masuk vs keluar</div>
        </div>
    </div>
    <div class="grid-2" style="margin-bottom:22px">
      <div class="card">
        <div class="section-title">Ringkasan Operasional</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[
            { label:'Total Luas Lahan', val: totalLahanHa + ' ha', color:'var(--emerald-400)' },
            { label:'Total Produksi', val: displayTotal, color:'var(--green-400)' },
            { label:'Total Potensi Pendapatan', val:'Rp '+totalPendapatanPanen.toLocaleString('id-ID'), color:'var(--emerald-400)' },
          ].map(r=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-secondary);border-radius:8px">
              <span style="font-size:13px;color:var(--text-secondary)">${r.label}</span>
              <span style="font-weight:700;font-size:14px;color:${r.color}">${r.val}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="section-title">Realisasi Keuangan (Cash)</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[
            { label:'Uang Masuk Tercatat', val:'Rp '+cashMasuk.toLocaleString('id-ID'), color:'var(--green-400)' },
            { label:'Uang Keluar Tercatat', val:'Rp '+cashKeluar.toLocaleString('id-ID'), color:'var(--red-400)' },
            { label:'Efisiensi Kas', val: cashMasuk > 0 ? ((netCashFlow / cashMasuk)*100).toFixed(1) + '%' : '0%', color:'var(--blue-400)' },
          ].map(r=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-secondary);border-radius:8px">
              <span style="font-size:13px;color:var(--text-secondary)">${r.label}</span>
              <span style="font-weight:700;font-size:14px;color:${r.color}">${r.val}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    
    <div class="card" style="margin-bottom:22px">
      <div class="section-title">Performa Bulanan — Produksi (ton)</div>
      <div class="chart-container" style="height:200px"><canvas id="chartBulanan"></canvas></div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="section-title">Pendapatan per Tanaman (Rp juta)</div>
        <div class="chart-container" style="height:240px"><canvas id="chartPendapatan"></canvas></div>
      </div>
      <div class="card">
        <div class="section-title">Kualitas Panen</div>
        <div class="chart-container" style="height:200px"><canvas id="chartKualitas"></canvas></div>
      </div>
    </div>`;
}

async function initLaporanCharts() {
  const { data: listPanen } = await SB.panen.fetch();
  const arrPanen = listPanen || [];

  const colors = ['#16a34a','#059669','#0d9488','#15803d','#166534','#14532d','#365314','#713f12'];

  const MULTIPLIERS = window.APP_MULTIPLIERS || { 'kg': 1, 'ton': 1000 };
  const ctxD = document.getElementById('chartDonut');
  if (ctxD && !ctxD._chart) {
    ctxD._chart = new Chart(ctxD, { type: 'doughnut', data: {
      labels: arrPanen.map(p=>p.tanaman),
      datasets: [{ data: arrPanen.map(p => (p.jumlah||0) * (MULTIPLIERS[(p.satuan||'kg').toLowerCase()]||1)), backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }]
    }, options: { responsive:true, maintainAspectRatio:false, plugins: { legend: { position:'right', labels: { color:'#a3b5a8', font:{size:11} } } } } });
  }

  const ctxP = document.getElementById('chartPendapatan');
  if (ctxP && !ctxP._chart) {
    ctxP._chart = new Chart(ctxP, { type:'bar', data: {
      labels: arrPanen.map(p=>p.tanaman),
      datasets: [{ label:'Pendapatan (jt)', data: arrPanen.map(p=>((p.total||0)/1000000).toFixed(1)), backgroundColor: colors, borderRadius: 8, borderSkipped: false }]
    }, options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales: { x:{ grid:{display:false}, ticks:{color:'#6b7d70',font:{size:10},maxRotation:30} }, y:{ grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#6b7d70',font:{size:10}} } } } });
  }

  const ctxB = document.getElementById('chartBulanan');
  if (ctxB && !ctxB._chart) {
    ctxB._chart = new Chart(ctxB, { type:'line', data: {
      labels: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'],
      datasets: [
        { label:'2025', data:[38,42,45,40,55,60,58,62,70,65,72,68], borderColor:'rgba(34,197,94,0.4)', borderWidth:2, pointRadius:0, fill:false, tension:0.4 },
        { label:'2026', data:[40,45,50,0,0,0,0,0,0,0,0,0], borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,0.08)', borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#22c55e', fill:true, tension:0.4 }
      ]
    }, options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#a3b5a8', font:{size:11} } } }, scales: { x:{ grid:{display:false}, ticks:{color:'#6b7d70',font:{size:11}} }, y:{ grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#6b7d70',font:{size:11}} } } } });
  }

  const ctxK = document.getElementById('chartKualitas');
  if (ctxK && !ctxK._chart) {
    const qa = arrPanen.filter(p=>p.kualitas==='A').length;
    const qb = arrPanen.filter(p=>p.kualitas==='B').length;
    const qc = arrPanen.filter(p=>p.kualitas==='C').length;
    ctxK._chart = new Chart(ctxK, { type:'pie', data: {
      labels:['Kualitas A','Kualitas B','Kualitas C'],
      datasets:[{ data:[qa,qb,qc], backgroundColor:['#22c55e','#f59e0b','#ef4444'], borderWidth:0 }]
    }, options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:'#a3b5a8', font:{size:12} } } } } });
  }
}

/* ---- CUACA ---- */
async function renderCuaca() {
  const { data: listLahan } = await SB.lahan.fetch();
  let lat = null, lng = null, locationName = 'Kalimantan Tengah';

  // Prioritas 1: Karu Lahan dengan Koordinat
  const lahanWithCoords = (listLahan || []).find(l => l.lat && l.lng);
  if (lahanWithCoords) {
    lat = lahanWithCoords.lat;
    lng = lahanWithCoords.lng;
    locationName = lahanWithCoords.nama;
  } else {
    // Prioritas 2: User GPS
    try {
      const pos = await WeatherService.getUserLocation();
      lat = pos.lat;
      lng = pos.lng;
      locationName = 'Lokasi Anda';
    } catch (e) {
      // Default: Palangka Raya (Kalteng)
      lat = -2.21; lng = 113.92;
      locationName = 'Kalimantan Tengah (Default)';
    }
  }

  const forecast = await WeatherService.getForecast(lat, lng);
  if (!forecast) {
    return `<div class="alert alert-danger" style="margin-top:20px">
      <strong>Gagal Memuat Cuaca</strong><br>
      Pastikan koneksi internet stabil atau izinkan akses lokasi pada browser.
    </div>`;
  }

  // Simpan data untuk chart
  window._curRainData = forecast.daily.map(d => d.rainSum);
  window._curRainLabels = forecast.daily.map(d => d.shortDay);

  const cur = forecast.current;

  return `
  <div class="page-header">
    <div>
      <div class="page-title">Monitor Cuaca Real-time</div>
      <div class="page-subtitle">Prakiraan akurat berdasarkan lokasi ${locationName.includes('Lokasi') ? locationName : 'Blok ' + locationName}.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary btn-sm" onclick="navigate('cuaca')">
         <span class="material-symbols-outlined" style="font-size:16px">refresh</span> Refresh
      </button>
    </div>
  </div>

  <div class="weather-card" style="margin-bottom:22px;position:relative;background:linear-gradient(135deg, #10b981, #059669);color:white;padding:32px;border-radius:24px;overflow:hidden">
    <div style="position:absolute;top:-20px;right:-20px;font-size:180px;opacity:0.15;line-height:1">${cur.icon}</div>
    <div style="position:relative;z-index:1">
      <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;background:rgba(255,255,255,0.2);width:fit-content;padding:4px 12px;border-radius:99px;margin-bottom:16px">
        <span class="material-symbols-outlined" style="font-size:14px">location_on</span> ${locationName}
      </div>
      <div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap">
        <div>
          <div style="font-size:64px;font-weight:800;line-height:1">${cur.temp}°C</div>
          <div style="font-size:18px;font-weight:600;margin-top:8px;opacity:0.9">${cur.desc} — Terasa seperti ${cur.feels}°C</div>
        </div>
        <div style="font-size:84px;line-height:1">${cur.icon}</div>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:16px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.1);padding-top:24px">
        <div class="weather-detail">
            <div style="font-size:11px;opacity:0.7;text-transform:uppercase;letter-spacing:0.5px">Kelembaban</div>
            <div style="font-size:18px;font-weight:700">${cur.humid}%</div>
        </div>
        <div class="weather-detail">
            <div style="font-size:11px;opacity:0.7;text-transform:uppercase;letter-spacing:0.5px">Kecepatan Angin</div>
            <div style="font-size:18px;font-weight:700">${cur.wind} km/h</div>
        </div>
        <div class="weather-detail">
            <div style="font-size:11px;opacity:0.7;text-transform:uppercase;letter-spacing:0.5px">Curah Hujan</div>
            <div style="font-size:18px;font-weight:700">${cur.rain} mm</div>
        </div>
        <div class="weather-detail">
            <div style="font-size:11px;opacity:0.7;text-transform:uppercase;letter-spacing:0.5px">Suhu Min / Max</div>
            <div style="font-size:18px;font-weight:700">${forecast.daily[0].min}° / ${forecast.daily[0].max}°</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:22px">
    <div class="section-title">Prakiraan 7 Hari Ke Depan</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(100px, 1fr));gap:12px">
      ${forecast.daily.map((f,i) => `
        <div style="text-align:center;padding:16px 8px;background:var(--bg-secondary);border-radius:16px;border:1.5px solid ${i===0?'var(--primary)':'var(--border-card)'};transition:all 0.2s" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='${i===0?'var(--primary)':'var(--border-card)'}'">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase">${i===0?'Hari Ini':f.day.split(',')[0]}</div>
          <div style="font-size:32px;margin-bottom:8px">${f.icon}</div>
          <div style="font-size:15px;font-weight:800;color:var(--text-primary)">${f.max}°</div>
          <div style="font-size:12px;color:var(--text-muted)">${f.min}°</div>
          <div style="margin-top:10px;font-size:10px;color:var(--blue-400);font-weight:700;display:flex;align-items:center;justify-content:center;gap:2px">
            <span class="material-symbols-outlined" style="font-size:10px">water_drop</span> ${f.rainProb}%
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="section-title">Rekomendasi Kegiatan Tani</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${[
          { ok: cur.rain < 0.5 && cur.wind < 15, kegiatan: 'Pemupukan & Penyemprotan', alasan: cur.rain > 0 ? 'Waspada potensi hujan ringan.' : 'Cuaca mendukung penyerapan nutrisi.' },
          { ok: cur.temp < 32, kegiatan: 'Aktivitas Panen', alasan: cur.temp > 30 ? 'Gunakan pelindung, suhu cukup terik.' : 'Suhu ideal untuk bekerja di lapangan.' },
          { ok: forecast.daily[0].rainProb < 50, kegiatan: 'Pengeringan Hasil Panen', alasan: forecast.daily[0].rainProb > 30 ? 'Siapkan peneduh, ada potensi hujan.' : 'Terik matahari cukup untuk pengeringan.' },
          { ok: cur.humid > 60, kegiatan: 'Irigasi Lahan', alasan: cur.humid < 70 ? 'Kelembaban udara rendah, cek kadar air tanah.' : 'Kelembaban terjaga.' }
        ].map(r => `
          <div style="display:flex;gap:14px;padding:14px;background:var(--bg-secondary);border-radius:12px;border-left:4px solid ${r.ok?'var(--green-500)':'var(--amber-500)'}">
            <span style="font-size:20px">${r.ok?'✅':'⚠️'}</span>
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--text-primary)">${r.kegiatan}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;line-height:1.4">${r.alasan}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card">
      <div class="section-title">Prakiraan Curah Hujan (mm)</div>
      <div class="chart-container" style="height:240px"><canvas id="chartHujan"></canvas></div>
    </div>
  </div>`;
}

async function initCuacaCharts() {
  const ctxH = document.getElementById('chartHujan');
  if (ctxH && !ctxH._chart) {
    const labels = window._curRainLabels || ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
    const data   = window._curRainData   || [0,0,0,0,0,0,0];

    ctxH._chart = new Chart(ctxH, { 
      type: 'bar', 
      data: {
        labels: labels,
        datasets: [{ 
          label: 'Curah Hujan (mm)', 
          data: data, 
          backgroundColor: ctx => {
            const v = ctx.raw;
            return v > 10 ? 'rgba(239,68,68,0.7)' : v > 2 ? 'rgba(251,191,36,0.7)' : 'rgba(16,185,129,0.7)';
          }, 
          borderRadius: 8, 
          borderSkipped: false 
        }]
      }, 
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { legend: { display: false } }, 
        scales: { 
          x: { grid: { display: false }, ticks: { color: '#6b7d70', font: { size: 11, weight: 'bold' } } }, 
          y: { 
            grid: { color: 'rgba(0,0,0,0.05)' }, 
            beginAtZero: true,
            ticks: { color: '#6b7d70', font: { size: 11 } },
            title: { display: true, text: 'millimeter (mm)', color: '#6b7d70', font: { size: 10 } }
          } 
        } 
      } 
    });
  }
}
