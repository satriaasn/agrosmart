/* =============================================
   AgroSmart — Pages: Panen, Laporan, Cuaca
   ============================================= */

/* ---- PANEN ---- */
async function renderPanen() {
  const { data: listPanen } = await SB.panen.fetch();
  const arrPanen = listPanen || [];
  
  const totalKg  = arrPanen.reduce((a,p) => a + (p.jumlah||0), 0);
  const totalRp  = arrPanen.reduce((a,p) => a + (p.total||0), 0);
  const avgKg    = arrPanen.length ? Math.round(totalKg / arrPanen.length) : 0;
  return `
  <div class="page-header">
    <div>
      <div class="page-title">Catatan Panen</div>
      <div class="page-subtitle">Rekap seluruh kegiatan panen dan hasil produksi.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="openPanenModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Catat Panen
      </button>
    </div>
  </div>
  <div class="stats-grid" style="margin-bottom:22px">
    <div class="stat-card" style="--card-accent:#22c55e">
      <div class="stat-header"><span class="stat-label">Total Panen</span><div class="stat-icon-wrapper">📦</div></div>
      <div class="stat-value">${(totalKg/1000).toFixed(1)}<span class="stat-unit">ton</span></div>
    </div>
    <div class="stat-card" style="--card-accent:#10b981">
      <div class="stat-header"><span class="stat-label">Total Pendapatan</span><div class="stat-icon-wrapper">💰</div></div>
      <div class="stat-value">Rp <span style="font-size:22px">${(totalRp/1000000).toFixed(0)}jt</span></div>
    </div>
    <div class="stat-card" style="--card-accent:#f59e0b">
      <div class="stat-header"><span class="stat-label">Rata-rata / Panen</span><div class="stat-icon-wrapper">📊</div></div>
      <div class="stat-value">${(avgKg/1000).toFixed(1)}<span class="stat-unit">ton</span></div>
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
        <thead><tr><th>Tanaman</th><th>Blok</th><th>Tanggal</th><th>Jumlah</th><th>Kualitas</th><th>Harga/kg</th><th>Total</th><th>Karyawan</th><th>Aksi</th></tr></thead>
        <tbody>
          ${arrPanen.map(p => `
            <tr>
              <td><strong>${p.tanaman}</strong></td>
              <td>${p.lahan}</td>
              <td>${new Date(p.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</td>
              <td><span class="harvest-amount">${(p.jumlah||0).toLocaleString('id-ID')} ${p.satuan||'kg'}</span></td>
              <td><span class="badge ${p.kualitas==='A'?'badge-green':'badge-yellow'}">${p.kualitas||'-'}</span></td>
              <td>Rp ${(p.harga||0).toLocaleString('id-ID')}</td>
              <td style="font-weight:600;color:var(--green-400)">Rp ${(p.total||0).toLocaleString('id-ID')}</td>
              <td style="font-size:12px;color:var(--text-secondary)">${p.karyawan||'-'}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-sm btn-secondary" onclick="editPanen('${p.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deletePanen('${p.id}')">Hapus</button>
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
  const [{ data: listPanen }, { data: listTanaman }, { data: listLahan }, { data: listKaryawan }] = await Promise.all([
    SB.panen.fetch(),
    SB.tanaman.fetch(),
    SB.lahan.fetch(),
    SB.karyawan.fetch()
  ]);
  const arrPanen    = listPanen    || [];
  const arrTanaman  = listTanaman  || [];
  const arrLahan    = listLahan    || [];
  const arrKaryawan = listKaryawan || [];

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
      <div class="form-group"><label class="form-label">Tanggal Panen</label><input class="form-control" type="date" id="f-pTgl" value="${p?.tanggal || new Date().toISOString().slice(0,10)}"></div>
      <div class="form-group">
        <label class="form-label">Satuan</label>
        <select class="form-control" id="f-pSatuan">
          ${['kg','ton','kwintal','ikat','buah'].map(s => `<option ${(p?.satuan||'kg')===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Jumlah *</label><input class="form-control" type="number" id="f-pJml" value="${p?.jumlah||''}" placeholder="0" min="0"></div>
      <div class="form-group">
        <label class="form-label">Harga (Rp) *</label>
        <div style="display:flex;gap:4px">
            <input class="form-control" type="number" id="f-pHarga" value="${p?.harga_raw||p?.harga||''}" placeholder="0" min="0" style="flex:1">
            <select class="form-control" id="f-pHargaTipe" style="width:100px;font-size:11px">
                <option value="per_kg" ${p?.multiplier_label==='per_kg'?'selected':''}>/ kg</option>
                <option value="per_satuan" ${p?.multiplier_label==='per_satuan'?'selected':''}>/ unit</option>
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
      <div class="form-group"><label class="form-label">Penanggung Jawab</label>
        <select class="form-control" id="f-pKary">
          <option value="">— Pilih karyawan —</option>
          ${arrKaryawan.map(k => `<option ${p?.karyawan===k.nama?'selected':''}>${k.nama}</option>`).join('')}
        </select>
      </div>
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
    <script>
      (function(){
        function updatePreview() {
            const jInput = document.getElementById('f-pJml');
            const hInput = document.getElementById('f-pHarga');
            const sSelect = document.getElementById('f-pSatuan');
            const tSelect = document.getElementById('f-pHargaTipe');
            const box = document.getElementById('previewTotal');
            const val = document.getElementById('previewTotalVal');
            const info = document.getElementById('previewInfo');
            
            if (!jInput || !hInput || !sSelect || !box || !val) return;

            const j = parseFloat(jInput.value || 0);
            const h = parseFloat(hInput.value || 0);
            const s = sSelect.value;
            const t = tSelect.value;
            
            if (j > 0 && h > 0) {
                let multiplier = 1;
                if (t === 'per_kg') {
                    if (s === 'ton') multiplier = 1000;
                    else if (s === 'kwintal') multiplier = 100;
                }
                
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
        ['input','change'].forEach(ev => {
            document.getElementById('f-pJml')?.addEventListener(ev, updatePreview);
            document.getElementById('f-pHarga')?.addEventListener(ev, updatePreview);
            document.getElementById('f-pSatuan')?.addEventListener(ev, updatePreview);
            document.getElementById('f-pHargaTipe')?.addEventListener(ev, updatePreview);
        });
        
        // Initial run
        setTimeout(updatePreview, 100);
      })();
    </script>
  `, async () => {
    const multiplierLabel = document.getElementById('f-pHargaTipe').value || 'per_kg';
    const rawHarga = +document.getElementById('f-pHarga').value;
    const satuan = document.getElementById('f-pSatuan').value || 'kg';
    
    // Calculate effective price per selected unit
    let effectiveHarga = rawHarga;
    if (multiplierLabel === 'per_kg') {
        if (satuan === 'ton') effectiveHarga = rawHarga * 1000;
        else if (satuan === 'kwintal') effectiveHarga = rawHarga * 100;
    }

    const data = {
      tanaman,
      lahan,
      tanggal:  document.getElementById('f-pTgl').value,
      jumlah,
      satuan:   satuan,
      kualitas: document.getElementById('f-pKual').value,
      harga:    effectiveHarga,
      multiplier_label: multiplierLabel, // Simpan untuk referensi saat edit
      harga_raw: rawHarga, 
      karyawan: document.getElementById('f-pKary').value || null
    };

    if (window.APP_ROLE === 'operator' && window.APP_OWNER_ID) {
      data.owner_id = window.APP_OWNER_ID;
    }

    if (p) {
      await SB.panen.update(p.id, data);
      showToast('success', 'Diperbarui', 'Catatan panen berhasil diperbarui.');
    } else {
      await SB.panen.insert(data);
      showToast('success', 'Tersimpan', 'Catatan panen berhasil ditambahkan.');
    }
    navigate('panen');
  });
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
  if (!confirm('Yakin hapus catatan panen ini?')) return;
  await SB.panen.remove(id);
  showToast('success', 'Dihapus', 'Catatan panen dihapus.');
  navigate('panen');
}


/* ---- LAPORAN ---- */
async function renderLaporan() {
  const [{ data: listPanen }, { data: listKaryawan }] = await Promise.all([
    SB.panen.fetch(),
    SB.karyawan.fetch()
  ]);
  const arrPanen = listPanen || [];
  const arrKaryawan = listKaryawan || [];

  return `
  <div class="page-header">
    <div>
      <div class="page-title">Laporan & Analitik</div>
      <div class="page-subtitle">Analisis performa perkebunan Anda secara lengkap.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="showToast('info','Ekspor','Laporan berhasil diekspor ke PDF.')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Ekspor PDF
      </button>
    </div>
  </div>

  <div class="grid-2" style="margin-bottom:22px">
    <div class="card">
      <div class="section-title">Produksi per Tanaman (Bulan Ini)</div>
      <div class="chart-container" style="height:240px"><canvas id="chartDonut"></canvas></div>
    </div>
    <div class="card">
      <div class="section-title">Pendapatan per Tanaman (Rp juta)</div>
      <div class="chart-container" style="height:240px"><canvas id="chartPendapatan"></canvas></div>
    </div>
  </div>

  <div class="card" style="margin-bottom:22px">
    <div class="section-title">Performa Bulanan — Produksi (ton)</div>
    <div class="chart-container" style="height:200px"><canvas id="chartBulanan"></canvas></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="section-title">Ringkasan Keuangan</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${[
          { label:'Total Pendapatan Panen', val:'Rp '+arrPanen.reduce((a,p)=>a+(p.total||0),0).toLocaleString('id-ID'), color:'var(--green-400)' },
          { label:'Estimasi Biaya Operasional', val:'Rp 38.500.000', color:'var(--red-400)' },
          { label:'Laba Bersih Estimasi', val:'Rp '+(arrPanen.reduce((a,p)=>a+(p.total||0),0)-38500000).toLocaleString('id-ID'), color:'var(--blue-400)' },
          { label:'Total Gaji Karyawan', val:'Rp '+arrKaryawan.reduce((a,k)=>a+(k.gaji||0),0).toLocaleString('id-ID'), color:'var(--amber-400)' },
        ].map(r=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-secondary);border-radius:8px">
            <span style="font-size:13px;color:var(--text-secondary)">${r.label}</span>
            <span style="font-weight:700;font-size:14px;color:${r.color}">${r.val}</span>
          </div>
        `).join('')}
      </div>
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

  const ctxD = document.getElementById('chartDonut');
  if (ctxD && !ctxD._chart) {
    ctxD._chart = new Chart(ctxD, { type: 'doughnut', data: {
      labels: arrPanen.map(p=>p.tanaman),
      datasets: [{ data: arrPanen.map(p=>p.jumlah), backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }]
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
  const forecasts = [
    { hari:'Senin',  ikon:'☀️',  min:24, max:32, hujan:5,  angin:12, humid:65 },
    { hari:'Selasa', ikon:'⛅',  min:23, max:30, hujan:30, angin:15, humid:72 },
    { hari:'Rabu',   ikon:'🌧️', min:22, max:27, hujan:80, angin:20, humid:88 },
    { hari:'Kamis',  ikon:'🌦️', min:23, max:29, hujan:40, angin:14, humid:78 },
    { hari:'Jumat',  ikon:'☀️',  min:25, max:33, hujan:5,  angin:10, humid:62 },
    { hari:'Sabtu',  ikon:'⛅',  min:24, max:31, hujan:20, angin:13, humid:68 },
    { hari:'Minggu', ikon:'☀️',  min:26, max:34, hujan:5,  angin:9,  humid:60 },
  ];

  return `
  <div class="page-header">
    <div>
      <div class="page-title">Monitor Cuaca</div>
      <div class="page-subtitle">Data cuaca real-time dan prakiraan 7 hari ke depan untuk perkebunan.</div>
    </div>
  </div>

  <div class="weather-card" style="margin-bottom:22px;position:relative">
    <div class="weather-bg"></div>
    <div style="position:relative;z-index:1">
      <div style="font-size:13px;color:rgba(255,255,255,0.5);font-weight:600;margin-bottom:8px">📍 Kalimantan Tengah — Hari Ini</div>
      <div style="display:flex;align-items:flex-end;gap:24px">
        <div>
          <div class="weather-temp">28°C</div>
          <div class="weather-desc">Sebagian berawan — Cocok untuk aktivitas kebun</div>
        </div>
        <div style="font-size:72px;line-height:1">⛅</div>
      </div>
      <div class="weather-details">
        <div class="weather-detail"><div class="weather-detail-label">Kelembaban</div><div class="weather-detail-val">74%</div></div>
        <div class="weather-detail"><div class="weather-detail-label">Kecepatan Angin</div><div class="weather-detail-val">13 km/h</div></div>
        <div class="weather-detail"><div class="weather-detail-label">Peluang Hujan</div><div class="weather-detail-val">20%</div></div>
        <div class="weather-detail"><div class="weather-detail-label">Tekanan Udara</div><div class="weather-detail-val">1013 hPa</div></div>
        <div class="weather-detail"><div class="weather-detail-label">Titik Embun</div><div class="weather-detail-val">22°C</div></div>
        <div class="weather-detail"><div class="weather-detail-label">UV Index</div><div class="weather-detail-val">7 (Tinggi)</div></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:22px">
    <div class="section-title">Prakiraan 7 Hari</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:12px">
      ${forecasts.map((f,i) => `
        <div style="text-align:center;padding:14px 8px;background:var(--bg-secondary);border-radius:12px;border:1px solid ${i===0?'var(--border-strong)':'var(--border-card)'}">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:8px">${f.hari}</div>
          <div style="font-size:28px;margin-bottom:8px">${f.ikon}</div>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${f.max}°</div>
          <div style="font-size:11px;color:var(--text-muted)">${f.min}°</div>
          <div style="margin-top:8px;font-size:10px;color:var(--blue-400);font-weight:600">💧 ${f.hujan}%</div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="section-title">Rekomendasi Kegiatan</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${[
          { ok:true,  kegiatan:'Pemupukan Blok A & B', alasan:'Cuaca cerah, pupuk akan terserap optimal.' },
          { ok:true,  kegiatan:'Penyemprotan pestisida', alasan:'Tidak ada hujan dalam 6 jam ke depan.' },
          { ok:false, kegiatan:'Pemangkasan tanaman', alasan:'Angin cukup kencang (13 km/h), tunda besok.' },
          { ok:true,  kegiatan:'Irigasi Blok E (Tebu)', alasan:'Kelembaban tanah 48% — perlu penyiraman.' },
          { ok:false, kegiatan:'Panen Karet Blok B', alasan:'Prakiraan hujan Rabu pagi, tunda ke Kamis.' },
        ].map(r=>`
          <div style="display:flex;gap:12px;padding:12px;background:var(--bg-secondary);border-radius:10px;border-left:3px solid ${r.ok?'var(--green-500)':'var(--amber-500)'}">
            <span style="font-size:18px">${r.ok?'✅':'⚠️'}</span>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${r.kegiatan}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${r.alasan}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card">
      <div class="section-title">Curah Hujan Mingguan (mm)</div>
      <div class="chart-container" style="height:220px"><canvas id="chartHujan"></canvas></div>
    </div>
  </div>`;
}

async function initCuacaCharts() {
  const ctxH = document.getElementById('chartHujan');
  if (ctxH && !ctxH._chart) {
    ctxH._chart = new Chart(ctxH, { type:'bar', data: {
      labels: ['Sen','Sel','Rab','Kam','Jum','Sab','Min'],
      datasets: [{ label:'Curah Hujan (mm)', data:[2,8,45,22,3,12,1], backgroundColor: ctx => {
        const v = ctx.raw;
        return v > 30 ? 'rgba(239,68,68,0.7)' : v > 15 ? 'rgba(251,191,36,0.7)' : 'rgba(96,165,250,0.7)';
      }, borderRadius: 8, borderSkipped: false }]
    }, options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales: { x:{grid:{display:false},ticks:{color:'#6b7d70',font:{size:11}}}, y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#6b7d70',font:{size:11}},title:{display:true,text:'mm',color:'#6b7d70'}} } } });
  }
}
