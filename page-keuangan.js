/* =============================================
   AgroSmart — Page: Keuangan (Biaya & Keuntungan per Lahan)
   ============================================= */

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLahanBiaya(lahanNama, listBiaya) {
  return (listBiaya||[]).filter(b => b.lahan === lahanNama);
}
function getLahanPanen(lahanNama, listPanen) {
  return (listPanen||[]).filter(p => p.lahan === lahanNama);
}
function totalBiayaLahan(lahanNama, listBiaya) {
  return getLahanBiaya(lahanNama, listBiaya).reduce((a, b) => a + b.total, 0);
}
function totalPendapatanLahan(lahanNama, listPanen) {
  return getLahanPanen(lahanNama, listPanen).reduce((a, p) => a + p.total, 0);
}
function totalTonaseLahan(lahanNama, listPanen) {
  return getLahanPanen(lahanNama, listPanen).reduce((a, p) => a + p.jumlah, 0);
}
function rataHargaLahan(lahanNama, listPanen) {
  const records = getLahanPanen(lahanNama, listPanen);
  if (!records.length) return 0;
  return Math.round(records.reduce((a, p) => a + p.harga, 0) / records.length);
}

// ─── Kategori Warna (Dynamic fallback) ───────────────────────────────────────────
let BIAYA_COLORS = {
  'Lainnya': { badge:'badge-gray', bg:'rgba(255,255,255,0.07)', icon:'📋' }
};

async function loadKeuanganMetadata() {
  const [{ data: kats }, { data: sats }] = await Promise.all([
    SB.expense_categories.fetch(),
    SB.units.fetch('biaya')
  ]);
  window._DYNAMIC_KATS = kats || [];
  window._DYNAMIC_SATS_BIAYA = sats || [];
  
  // Update colors object
  const colors = {};
  window._DYNAMIC_KATS.forEach(k => {
    colors[k.name] = { 
        badge: 'badge-green', // Simple fallback, can be more complex
        bg: 'rgba(34,197,94,0.12)',
        icon: k.icon || '📋' 
    };
  });
  if (!colors['Lainnya']) colors['Lainnya'] = { badge:'badge-gray', bg:'rgba(255,255,255,0.07)', icon:'📋' };
  BIAYA_COLORS = colors;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE RENDER
// ═══════════════════════════════════════════════════════════════════════════════
async function renderKeuangan() {
  await loadKeuanganMetadata();
  const [{ data: listBiaya }, { data: listPanen }, { data: listLahan }] = await Promise.all([
    SB.biaya.fetch(),
    SB.panen.fetch(),
    SB.lahan.fetch()
  ]);
  const arrBiaya = listBiaya || [];
  const arrPanen = listPanen || [];
  const arrLahan = listLahan || [];

  window._CACHE_BIAYA = arrBiaya; // For quick sync filtering
  
  // Aggregate summary across all lahan
  const totalBiaya      = arrBiaya.reduce((a, b) => a + b.total, 0);
  const totalPendapatan = arrPanen.reduce((a, p) => a + p.total, 0);
  const totalLaba       = totalPendapatan - totalBiaya;
  const margin          = totalPendapatan > 0 ? ((totalLaba / totalPendapatan) * 100).toFixed(1) : 0;

  return `
  <div class="page-header">
    <div>
      <div class="page-title">Biaya Olah Lahan</div>
      <div class="page-subtitle">Monitor rincian biaya operasional, hasil panen, dan laba kotor per lahan.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="navigate('keuangan-biaya')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Kelola Biaya
      </button>
      ${canAccess('keuangan', 'add') ? `
      <button class="btn btn-primary" onclick="openBiayaModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Biaya
      </button>` : ''}
    </div>
  </div>

  <!-- Top Summary Cards -->
  <div class="stats-grid" style="margin-bottom:24px">
    <div class="stat-card" style="--card-accent:#ef4444;--icon-bg:rgba(239,68,68,0.12)">
      <div class="stat-header"><span class="stat-label">Total Modal / Biaya</span><div class="stat-icon-wrapper">💸</div></div>
      <div class="stat-value" style="font-size:24px">Rp ${(totalBiaya/1000000).toFixed(1)}<span class="stat-unit">jt</span></div>
      <span class="stat-change down">📊 ${arrBiaya.length} pos biaya</span>
    </div>
    <div class="stat-card" style="--card-accent:#22c55e;--icon-bg:rgba(34,197,94,0.12)">
      <div class="stat-header"><span class="stat-label">Total Pendapatan Panen</span><div class="stat-icon-wrapper">📦</div></div>
      <div class="stat-value" style="font-size:24px">Rp ${(totalPendapatan/1000000).toFixed(1)}<span class="stat-unit">jt</span></div>
      <span class="stat-change up">📊 ${arrPanen.length} sesi panen</span>
    </div>
    <div class="stat-card" style="--card-accent:${totalLaba>=0?'#10b981':'#ef4444'};--icon-bg:rgba(16,185,129,0.12)">
      <div class="stat-header"><span class="stat-label">Laba Bersih</span><div class="stat-icon-wrapper">💰</div></div>
      <div class="stat-value" style="font-size:24px;color:${totalLaba>=0?'var(--green-400)':'var(--red-400)'}">Rp ${(totalLaba/1000000).toFixed(1)}<span class="stat-unit">jt</span></div>
      <span class="stat-change ${totalLaba>=0?'up':'down'}">${totalLaba>=0?'▲':'▼'} Margin ${margin}%</span>
    </div>
    <div class="stat-card" style="--card-accent:#f59e0b;--icon-bg:rgba(245,158,11,0.12)">
      <div class="stat-header"><span class="stat-label">Total Tonase Panen</span><div class="stat-icon-wrapper">⚖️</div></div>
      <div class="stat-value" style="font-size:24px">${(arrPanen.reduce((a,p)=>a+(p.jumlah||0),0)/1000).toFixed(1)}<span class="stat-unit">ton</span></div>
      <span class="stat-change neutral">Seluruh lahan</span>
    </div>
  </div>

  <!-- Per-Lahan Profit Cards -->
  <div class="section-title">Keuntungan per Lahan</div>
  <div class="grid-auto" style="margin-bottom:24px" id="lahanProfitGrid">
    ${arrLahan.map(l => lahanProfitCard(l, arrLahan, arrBiaya, arrPanen)).join('')}
  </div>

  <!-- Charts Row -->
  <div class="grid-2" style="margin-bottom:24px">
    <div class="card">
      <div class="section-title">Perbandingan Biaya vs Pendapatan (Rp juta)</div>
      <div class="chart-container" style="height:240px"><canvas id="chartBiayaPendapatan"></canvas></div>
    </div>
    <div class="card">
      <div class="section-title">Distribusi Biaya per Kategori</div>
      <div class="chart-container" style="height:240px"><canvas id="chartKategori"></canvas></div>
    </div>
  </div>

  <!-- Biaya Terbaru -->
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div class="section-title" style="margin-bottom:0">Riwayat Biaya Operasional</div>
      <div style="display:flex;gap:8px;align-items:center">
        <select class="form-control" style="width:140px;padding:6px 10px;font-size:12px" onchange="filterBiayaLahan(this.value)">
          <option value="">Semua Lahan</option>
          ${arrLahan.map(l => `<option>${l.nama}</option>`).join('')}
        </select>
        <select class="form-control" style="width:140px;padding:6px 10px;font-size:12px" onchange="filterBiayaKat(this.value)">
          <option value="">Semua Kategori</option>
          ${Object.keys(BIAYA_COLORS).map(k=>`<option>${k}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="table-wrapper" id="biayaTableWrap">
      ${biayaTable(arrBiaya)}
    </div>
  </div>`;
}

// ─── Lahan Profit Card ────────────────────────────────────────────────────────
function lahanProfitCard(l, listLahan, listBiaya, listPanen) {
  const biaya       = totalBiayaLahan(l.nama, listBiaya);
  const pendapatan  = totalPendapatanLahan(l.nama, listPanen);
  const laba        = pendapatan - biaya;
  const tonase      = totalTonaseLahan(l.nama, listPanen);
  const harga       = rataHargaLahan(l.nama, listPanen);
  const margin      = pendapatan > 0 ? ((laba / pendapatan) * 100).toFixed(0) : 0;
  const isProfit    = laba >= 0;
  const pBar        = pendapatan > 0 ? Math.min((biaya / pendapatan) * 100, 100) : 0;
  const lahanInfo   = listLahan.find(lh => lh.nama === l.nama);

  // Breakdown per category
  const breakdown = {};
  getLahanBiaya(l.nama, listBiaya).forEach(b => {
    breakdown[b.kategori] = (breakdown[b.kategori] || 0) + b.total;
  });

  return `
  <div class="card" style="cursor:pointer" onclick="showLahanDetail('${l.nama}')">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">
      <div>
        <div style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:700">${l.nama}</div>
        <div style="font-size:12px;color:var(--text-secondary)">${lahanInfo?.tanaman || '-'} • ${l.luas} ha</div>
      </div>
      <span class="badge ${isProfit?'badge-green':'badge-red'}">${isProfit?'▲ Untung':'▼ Rugi'}</span>
    </div>

    <!-- Laba highlight -->
    <div style="background:${isProfit?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)'};border:1px solid ${isProfit?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'};border-radius:10px;padding:12px;margin-bottom:14px;text-align:center">
      <div style="font-size:10px;font-weight:600;color:var(--text-muted);letter-spacing:0.5px">LABA BERSIH</div>
      <div style="font-family:'Outfit',sans-serif;font-size:22px;font-weight:800;color:${isProfit?'var(--green-400)':'var(--red-400)'}">
        ${isProfit ? '' : '-'}Rp ${Math.abs(laba/1000000).toFixed(2)}jt
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Margin ${margin}%</div>
    </div>

    <!-- Biaya vs Pendapatan bar -->
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:5px">
        <span>💸 Biaya: <strong style="color:var(--red-400)">Rp ${(biaya/1000000).toFixed(2)}jt</strong></span>
        <span>📦 Pendapatan: <strong style="color:var(--green-400)">Rp ${(pendapatan/1000000).toFixed(2)}jt</strong></span>
      </div>
      <div style="background:rgba(34,197,94,0.15);border-radius:99px;height:8px;overflow:hidden">
        <div style="height:100%;width:${pBar}%;background:linear-gradient(90deg,#ef4444,#f97316);border-radius:99px;transition:width 1s ease"></div>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:4px;text-align:right">Biaya = ${pBar.toFixed(0)}% dari pendapatan</div>
    </div>

    <!-- Stats row -->
    <div class="grid-2" style="gap:8px;margin-bottom:12px">
      <div style="background:var(--bg-secondary);border-radius:8px;padding:10px">
        <div style="font-size:10px;color:var(--text-muted);font-weight:600">TONASE PANEN</div>
        <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-top:2px">${(tonase/1000).toFixed(2)} ton</div>
      </div>
      <div style="background:var(--bg-secondary);border-radius:8px;padding:10px">
        <div style="font-size:10px;color:var(--text-muted);font-weight:600">HARGA RATA-RATA</div>
        <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-top:2px">Rp ${harga.toLocaleString('id-ID')}/kg</div>
      </div>
    </div>

    <!-- Category breakdown -->
    ${Object.keys(breakdown).length ? `
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${Object.entries(breakdown).map(([kat, jml]) => {
        const c = BIAYA_COLORS[kat] || BIAYA_COLORS['Lainnya'];
        return `<span class="badge ${c.badge}" style="font-size:10px">${c.icon} ${kat}: Rp ${(jml/1000).toFixed(0)}rb</span>`;
      }).join('')}
    </div>` : '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:8px">Belum ada biaya tercatat</div>'}

    <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:12px;justify-content:center" onclick="event.stopPropagation();showLahanDetail('${l.nama}')">
      📋 Lihat Rincian
    </button>
  </div>`;
}

// ─── Biaya Table ──────────────────────────────────────────────────────────────
function biayaTable(data) {
  if (!data.length) return `<div style="text-align:center;padding:40px;color:var(--text-muted)">Belum ada data biaya</div>`;
  return `<table>
    <thead><tr><th>Lahan</th><th>Tanggal</th><th>Kategori</th><th>Deskripsi</th><th>Jumlah</th><th>Harga/Satuan</th><th>Total</th><th>Aksi</th></tr></thead>
    <tbody>
    ${data.map(b => {
      const c = BIAYA_COLORS[b.kategori] || BIAYA_COLORS['Lainnya'];
      return `<tr>
        <td><strong>${b.lahan}</strong></td>
        <td style="font-size:12px;color:var(--text-secondary)">${new Date(b.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</td>
        <td><span class="badge ${c.badge}">${c.icon} ${b.kategori}</span></td>
        <td style="font-size:13px">${b.deskripsi}</td>
        <td style="font-size:12px;color:var(--text-secondary)">${b.jumlah} ${b.satuan}</td>
        <td style="font-size:12px">Rp ${(b.harga_satuan||0).toLocaleString('id-ID')}</td>
        <td style="font-weight:700;color:var(--red-400)">Rp ${b.total.toLocaleString('id-ID')}</td>
        <td>
          <div style="display:flex;gap:6px">
            ${canAccess('keuangan', 'edit') ? `<button class="btn btn-sm btn-secondary" onclick="editBiaya('${b.id}')">Edit</button>` : ''}
            ${canAccess('keuangan', 'delete') ? `<button class="btn btn-sm btn-danger" onclick="deleteBiaya('${b.id}')">Hapus</button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('')}
    </tbody>
  </table>`;
}

// ─── Filter Biaya ─────────────────────────────────────────────────────────────
let _filterLahan = '';
let _filterKat   = '';

function filterBiayaLahan(val) {
  _filterLahan = val;
  applyBiayaFilter();
}
function filterBiayaKat(val) {
  _filterKat = val;
  applyBiayaFilter();
}
function applyBiayaFilter() {
  let data = window._CACHE_BIAYA || [];
  if (_filterLahan) data = data.filter(b => b.lahan === _filterLahan);
  if (_filterKat)   data = data.filter(b => b.kategori === _filterKat);
  const wrap = document.getElementById('biayaTableWrap');
  if (wrap) wrap.innerHTML = biayaTable(data);
}

// ─── Lahan Detail Modal ───────────────────────────────────────────────────────
async function showLahanDetail(lahanNama) {
  const [{ data: listBiaya }, { data: listPanen }, { data: listLahan }] = await Promise.all([
    SB.biaya.fetch(),
    SB.panen.fetch(),
    SB.lahan.fetch()
  ]);
  
  const biaya      = getLahanBiaya(lahanNama, listBiaya);
  const panen      = getLahanPanen(lahanNama, listPanen);
  const totBiaya   = biaya.reduce((a,b) => a+b.total, 0);
  const totPanen   = panen.reduce((a,p) => a+p.total, 0);
  const laba       = totPanen - totBiaya;
  const lahanInfo  = (listLahan||[]).find(l => l.nama === lahanNama) || {};

  openModal(`📊 Rincian ${lahanNama} — ${lahanInfo.tanaman || ''}`, `
    <div class="grid-3" style="gap:10px;margin-bottom:18px">
      <div style="background:rgba(239,68,68,0.08);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:10px;color:var(--text-muted);font-weight:600">TOTAL BIAYA</div>
        <div style="font-size:16px;font-weight:700;color:var(--red-400);margin-top:4px">Rp ${(totBiaya/1000000).toFixed(2)}jt</div>
      </div>
      <div style="background:rgba(34,197,94,0.08);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:10px;color:var(--text-muted);font-weight:600">PENDAPATAN</div>
        <div style="font-size:16px;font-weight:700;color:var(--green-400);margin-top:4px">Rp ${(totPanen/1000000).toFixed(2)}jt</div>
      </div>
      <div style="background:${laba>=0?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)'};border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:10px;color:var(--text-muted);font-weight:600">LABA BERSIH</div>
        <div style="font-size:16px;font-weight:700;color:${laba>=0?'var(--green-400)':'var(--red-400)'};margin-top:4px">${laba<0?'-':''}Rp ${Math.abs(laba/1000000).toFixed(2)}jt</div>
      </div>
    </div>

    <div style="font-weight:600;font-size:13px;margin-bottom:10px;color:var(--text-secondary)">💸 Rincian Biaya (${biaya.length} pos)</div>
    ${biaya.length ? `<div style="max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
      ${biaya.map(b=>{
        const c = BIAYA_COLORS[b.kategori]||BIAYA_COLORS['Lainnya'];
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-secondary);border-radius:8px">
          <div><span class="badge ${c.badge}" style="font-size:10px">${c.icon} ${b.kategori}</span><span style="margin-left:8px;font-size:12px">${b.deskripsi}</span></div>
          <span style="font-weight:600;color:var(--red-400);font-size:13px">Rp ${b.total.toLocaleString('id-ID')}</span>
        </div>`;
      }).join('')}
    </div>` : '<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Belum ada biaya.</p>'}

    <div style="font-weight:600;font-size:13px;margin-bottom:10px;color:var(--text-secondary)">📦 Rincian Panen (${panen.length} sesi)</div>
    ${panen.length ? `<div style="max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
      ${panen.map(p=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-secondary);border-radius:8px">
        <div>
          <span style="font-size:12px;font-weight:600">${p.tanaman}</span>
          <span style="font-size:11px;color:var(--text-muted);margin-left:8px">${p.jumlah.toLocaleString()} kg • Rp ${p.harga.toLocaleString('id-ID')}/kg</span>
        </div>
        <span style="font-weight:700;color:var(--green-400);font-size:13px">Rp ${p.total.toLocaleString('id-ID')}</span>
      </div>`).join('')}
    </div>` : '<p style="font-size:13px;color:var(--text-muted)">Belum ada panen.</p>'}
  `, null);

  // Hide save button since this is view-only
  const saveBtn = document.getElementById('modalSave');
  const cancelBtn = document.getElementById('modalCancel');
  if (saveBtn) saveBtn.style.display = 'none';
  if (cancelBtn) cancelBtn.textContent = 'Tutup';
}

// ─── Add/Edit Biaya Modal ─────────────────────────────────────────────────────
async function openBiayaModal(id) {
  const [{ data: listBiaya }, { data: listLahan }, { data: listCOA }, { data: listKats }] = await Promise.all([
    SB.biaya.fetch(),
    SB.lahan.fetch(),
    SB.coa.fetch(),
    SB.expense_categories.fetch()
  ]);
  const arrLahan = listLahan || [];
  const arrCOA   = (listCOA || []).filter(a => !a.is_header && a.account_type === 'Expense');
  const arrKats  = listKats || [];
  
  let b = null;
  if (id) b = (listBiaya||[]).find(x => String(x.id) === String(id));

  // Restore save button if previously hidden
  const saveBtn = document.getElementById('modalSave');
  if (saveBtn) saveBtn.style.display = '';
  const cancelBtn = document.getElementById('modalCancel');
  if (cancelBtn) cancelBtn.textContent = 'Batal';

  openModal(b ? 'Edit Pos Biaya' : 'Tambah Biaya Operasional', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Blok Lahan *</label>
        <select class="form-control" id="f-bLahan">
          ${arrLahan.map(l=>`<option ${b?.lahan===l.nama?'selected':''}>${l.nama}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Tanggal *</label>
        <input class="form-control" type="date" id="f-bTgl" value="${b?.tanggal||new Date().toISOString().slice(0,10)}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Kategori Biaya *</label>
        <select class="form-control" id="f-bKat">
          <option value="">— Pilih Kategori —</option>
          ${arrKats.map(k=>`<option value="${k.name}" ${b?.kategori===k.name?'selected':''}>${k.icon||'💸'} ${k.name}</option>`).join('')}
          ${!arrKats.some(k=>k.name==='Lainnya') ? `<option value="Lainnya" ${b?.kategori==='Lainnya'?'selected':''}>📋 Lainnya</option>` : ''}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Akun COA (Accounting)</label>
        <select class="form-control" id="f-bCOA" disabled style="background:var(--bg-input); cursor:not-allowed">
          <option value="">— Pilih Akun Beban —</option>
          ${arrCOA.map(a=>(`
            <option value="${a.id}" ${String(b?.coa_id)===String(a.id)?'selected':''}>
              [${a.account_code}] ${a.account_name}
            </option>
          `)).join('')}
        </select>
        <div style="font-size:10px; color:var(--text-muted); margin-top:2px">Ditentukan otomatis berdasarkan kategori biaya.</div>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Deskripsi / Vendor *</label>
      <input class="form-control" id="f-bDesc" value="${b?.deskripsi||''}" placeholder="cth. Pupuk NPK 25 kg dari Toko Tani">
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Jumlah</label>
        <input class="form-control" type="number" step="0.01" id="f-bJml" value="${b?.jumlah||''}" oninput="hitungTotalBiaya()">
      </div>
      <div class="form-group"><label class="form-label">Satuan</label>
        <select class="form-control" id="f-bSat">
          ${(window._DYNAMIC_SATS_BIAYA||[]).map(s=>`<option ${b?.satuan===s.name?'selected':''}>${s.name}</option>`).join('')}
          ${!(window._DYNAMIC_SATS_BIAYA||[]).some(s=>s.name==='kg') ? '<option>kg</option>' : ''}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Harga per Satuan (Rp)</label>
        <input class="form-control" type="number" id="f-bHarga" value="${b?.harga_satuan||''}" oninput="hitungTotalBiaya()">
      </div>
      <div class="form-group">
        <label class="form-label">Total Biaya (Rp)</label>
        <input class="form-control" type="number" id="f-bTotal" value="${b?.total||''}" style="font-weight:700;color:var(--red-400)" placeholder="Auto-hitung atau isi manual">
      </div>
    </div>
  `, async () => {
    const lahan = document.getElementById('f-bLahan').value;
    const kat   = document.getElementById('f-bKat').value;
    const desc  = document.getElementById('f-bDesc').value.trim();
    const jml   = parseFloat(document.getElementById('f-bJml').value);
    const sat   = document.getElementById('f-bSat').value;
    const harga = parseFloat(document.getElementById('f-bHarga').value);
    const total = parseFloat(document.getElementById('f-bTotal').value);
    const coa_id = document.getElementById('f-bCOA').value;
    const tgl    = document.getElementById('f-bTgl').value;

    if (!desc || !total) { showToast('danger','Gagal','Deskripsi dan total biaya wajib diisi.'); return; }
    if (!coa_id) { showToast('warning','Peringatan','Mohon pilih akun COA untuk pencatatan akuntansi.'); return; }

    const data = { 
      lahan, 
      tanggal: tgl, 
      kategori: kat, 
      deskripsi: desc, 
      jumlah: jml||0, 
      satuan: sat, 
      harga_satuan: harga||0,
      total: total||0,
      coa_id: coa_id ? parseInt(coa_id) : null
    };
    
    try {
      let savedBiaya;
      if (b) { 
        const { data: res, error } = await SB.biaya.update(b.id, data);
        if (error) throw error;
        savedBiaya = res; 
        showToast('success','Berhasil','Data biaya diperbarui.'); 
      } else { 
        const { data: res, error } = await SB.biaya.insert(data);
        if (error) throw error;
        savedBiaya = res; 
        showToast('success','Berhasil','Biaya baru ditambahkan.'); 
      }

      // --- SYNC TO CASH BOOK ---
      if (savedBiaya) {
        const cashData = {
          tipe: 'keluar',
          tanggal: tgl,
          jumlah: total,
          kategori: kat,
          coa_id: parseInt(coa_id),
          deskripsi: `[Biaya Lahan: ${lahan}] ${desc}`,
          ref_id: savedBiaya.id,
          ref_type: 'biaya'
        };

        // Check if cash entry exists
        const { data: existingCash } = await sb.from('cash_book').select('id').eq('ref_id', savedBiaya.id).eq('ref_type', 'biaya').maybeSingle();
        
        if (existingCash) {
          await SB.cash_book.update(existingCash.id, cashData);
        } else {
          await SB.cash_book.insert(cashData);
        }
      }

      navigate('keuangan');
    } catch (err) {
      console.error('Accounting Sync Error:', err);
      showToast('danger', 'Error Sync', 'Data tersimpan tapi gagal sinkron ke Buku Kas.');
      navigate('keuangan');
    }
  });

  // ─── Direct DOM Manipulation after Modal Opened ─────────────────────────────
  const katSelect = document.getElementById('f-bKat');
  const coaSelect = document.getElementById('f-bCOA');

  function updateCOA() {
    if (!katSelect || !coaSelect) return;
    const selectedKat = katSelect.value;
    const catObj = arrKats.find(k => k.name === selectedKat);
    
    // Debug log to console (User can see this if they open console)
    console.log('[AgroSmart] updateCOA:', {
        selected: selectedKat,
        foundCat: catObj?.name,
        linkedCOA: catObj?.coa_id,
        availableCOAs: arrCOA.length
    });

    if (catObj && catObj.coa_id) {
      // Force value even if types differ (id as number vs string)
      coaSelect.value = catObj.coa_id;
      
      // Verification
      if (coaSelect.value != catObj.coa_id) {
          console.warn('[AgroSmart] COA ID ' + catObj.coa_id + ' not found in the dropdown list.');
      }
    } else {
      coaSelect.value = "";
    }
  }

  if (katSelect && coaSelect) {
    katSelect.addEventListener('change', updateCOA);
    // Sync immediately (for initial render in edit mode or when opening new form)
    updateCOA(); 
  }
}

function hitungTotalBiaya() {
  const jml   = parseFloat(document.getElementById('f-bJml')?.value)   || 0;
  const harga = parseFloat(document.getElementById('f-bHarga')?.value) || 0;
  const tot   = document.getElementById('f-bTotal');
  if (tot && jml && harga) tot.value = (jml * harga).toFixed(0);
}

function editBiaya(id) { openBiayaModal(id); }
async function deleteBiaya(id) {
  if(!confirm('Yakin hapus biaya ini? Transaksi di Buku Kas juga akan dihapus.')) return;
  
  // Delete linked cash book entry first
  await sb.from('cash_book').delete().eq('ref_id', id).eq('ref_type', 'biaya');
  
  await SB.biaya.remove(id);
  showToast('success','Dihapus','Pos biaya dan transaksi kas dihapus.');
  navigate('keuangan');
}

// ─── Charts ───────────────────────────────────────────────────────────────────
async function initKeuanganCharts() {
  const [{ data: listBiaya }, { data: listPanen }, { data: listLahan }] = await Promise.all([
    SB.biaya.fetch(),
    SB.panen.fetch(),
    SB.lahan.fetch()
  ]);
  const arrBiaya = listBiaya || [];
  const arrPanen = listPanen || [];
  const arrLahan = listLahan || [];

  const lahanNames = arrLahan.map(l => l.nama);

  // Biaya vs Pendapatan grouped bar
  const ctxBP = document.getElementById('chartBiayaPendapatan');
  if (ctxBP && !ctxBP._chart) {
    ctxBP._chart = new Chart(ctxBP, {
      type: 'bar',
      data: {
        labels: lahanNames,
        datasets: [
          { label: 'Biaya (jt)',      data: lahanNames.map(n => +(totalBiayaLahan(n, arrBiaya)/1000000).toFixed(2)),     backgroundColor: 'rgba(239,68,68,0.7)',  borderRadius: 6 },
          { label: 'Pendapatan (jt)', data: lahanNames.map(n => +(totalPendapatanLahan(n, arrPanen)/1000000).toFixed(2)),backgroundColor: 'rgba(34,197,94,0.7)',  borderRadius: 6 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color:'#a3b5a8', font:{size:11} } } },
        scales: {
          x: { grid:{display:false}, ticks:{color:'#6b7d70',font:{size:10}} },
          y: { grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#6b7d70',font:{size:10}}, title:{display:true,text:'Rp Juta',color:'#6b7d70'} }
        }
      }
    });
  }

  // Kategori donut
  const ctxK = document.getElementById('chartKategori');
  if (ctxK && !ctxK._chart) {
    const kat = {};
    arrBiaya.forEach(b => { kat[b.kategori] = (kat[b.kategori]||0) + b.total; });
    ctxK._chart = new Chart(ctxK, {
      type: 'doughnut',
      data: {
        labels: Object.keys(kat),
        datasets: [{ data: Object.values(kat), backgroundColor: ['#16a34a','#d97706','#3b82f6','#0d9488','#ef4444','#6b7280','#8b5cf6'], borderWidth: 0, hoverOffset: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position:'right', labels:{ color:'#a3b5a8', font:{size:10} } } }
      }
    });
  }
}
