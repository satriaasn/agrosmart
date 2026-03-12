/* =============================================
   AgroSmart — Page: Dashboard
   ============================================= */

async function renderDashboard() {
  const [{ data: listLahan }, { data: listKaryawan }, { data: listPanen }, { data: listTanaman }, { data: listAktivitas }] = await Promise.all([
    SB.lahan.fetch(),
    SB.karyawan.fetch(),
    SB.panen.fetch(),
    SB.tanaman.fetch(),
    SB.aktivitas.fetch(6)
  ]);
  const arrLahan = listLahan || [];
  const arrKaryawan = listKaryawan || [];
  const arrPanen = listPanen || [];
  const arrAktivitas = listAktivitas || [];
  
  const totalLahanHa = arrLahan.reduce((a,l) => a + (l.luas||0), 0);
  const totalKaryawan = arrKaryawan.length;
  const totalPanen = arrPanen.reduce((a,p) => a + (p.jumlah||0), 0);
  const totalPendapatan = arrPanen.reduce((a,p) => a + (p.total||0), 0);

  return `
  <div class="page-header">
    <div>
      <div class="page-title">Dashboard</div>
      <div class="page-subtitle">Selamat datang, Budi! Berikut ringkasan perkebunan hari ini — ${new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="showToast('success','Laporan diperbarui','Data telah disinkronisasi.')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Perbarui
      </button>
      <button class="btn btn-primary" onclick="navigate('laporan')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Buat Laporan
      </button>
    </div>
  </div>

  ${arrLahan.length === 0 ? `
  <div class="card" style="margin-bottom:22px; background:rgba(16,185,129,0.05); border-color:var(--primary); text-align:center; padding:32px;">
    <div style="font-size:40px; margin-bottom:12px">🌱</div>
    <div class="section-title">Akun Anda masih kosong!</div>
    <div style="color:var(--text-secondary); margin-bottom:20px; font-size:14px; max-width:500px; margin-left:auto; margin-right:auto;">
      Untuk memudahkan Anda melihat dan mencoba seluruh fitur AgroSmart (seperti grafik, laporan, dan peta lahan), Anda bisa langsung memasukkan data sampel berupa lahan, tanaman, dan aktivitas dummy.
    </div>
    <button class="btn btn-primary" id="btnIsiDummy" onclick="injectDummyData(this)">✨ Isi Data Sampel (Dummy)</button>
    <div style="font-size:11px; color:var(--text-muted); margin-top:12px; font-style:italic;">Hanya berlaku 1 kali untuk akun baru. Anda dapat menghapusnya nanti.</div>
  </div>
  ` : ''}

  <!-- Stat Cards -->
  <div class="stats-grid">
    <div class="stat-card" style="--card-accent:#22c55e; --icon-bg:rgba(34,197,94,0.12)">
      <div class="stat-header">
        <span class="stat-label">Total Lahan</span>
        <div class="stat-icon-wrapper">🗺️</div>
      </div>
      <div class="stat-value">${totalLahanHa}<span class="stat-unit">ha</span></div>
      <span class="stat-change up">↑ 2 blok baru</span>
    </div>
    <div class="stat-card" style="--card-accent:#10b981; --icon-bg:rgba(16,185,129,0.12)">
      <div class="stat-header">
        <span class="stat-label">Produksi Bulan Ini</span>
        <div class="stat-icon-wrapper">📦</div>
      </div>
      <div class="stat-value">${(totalPanen/1000).toFixed(1)}<span class="stat-unit">ton</span></div>
      <span class="stat-change up">↑ 8.3% vs bulan lalu</span>
    </div>
    <div class="stat-card" style="--card-accent:#f59e0b; --icon-bg:rgba(245,158,11,0.12)">
      <div class="stat-header">
        <span class="stat-label">Karyawan Aktif</span>
        <div class="stat-icon-wrapper">👷</div>
      </div>
      <div class="stat-value">${totalKaryawan - 1}<span class="stat-unit">org</span></div>
      <span class="stat-change neutral">1 sedang cuti</span>
    </div>
    <div class="stat-card" style="--card-accent:#3b82f6; --icon-bg:rgba(59,130,246,0.12)">
      <div class="stat-header">
        <span class="stat-label">Pendapatan Bulan Ini</span>
        <div class="stat-icon-wrapper">💰</div>
      </div>
      <div class="stat-value">${(totalPendapatan/1000000).toFixed(0)}<span class="stat-unit">jt</span></div>
      <span class="stat-change up">↑ 12% vs target</span>
    </div>
  </div>

  <!-- Main Charts Row -->
  <div class="grid-2" style="margin-bottom:22px">
    <div class="card">
      <div class="section-title">Produksi per Tanaman (ton)</div>
      <div class="chart-container" style="height:220px">
        <canvas id="chartProduksi"></canvas>
      </div>
    </div>
    <div class="card">
      <div class="section-title">Tren Panen 7 Hari</div>
      <div class="chart-container" style="height:220px">
        <canvas id="chartTren"></canvas>
      </div>
    </div>
  </div>

  <!-- Mini-Map GIS Widget -->
  <div class="card" style="margin-bottom:22px;padding:0;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px;border-bottom:1px solid var(--border-card)">
      <div class="section-title" style="margin-bottom:0">🗺️ Peta Sebaran Lahan</div>
      <button class="btn btn-sm btn-secondary" onclick="navigate('peta')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
        Buka Peta Penuh
      </button>
    </div>
    <!-- Legend row -->
    <div style="display:flex;gap:16px;padding:10px 20px;background:var(--bg-secondary);border-bottom:1px solid var(--border-card);flex-wrap:wrap">
      ${['Aktif','Pemeliharaan','Tidak Aktif'].map((s,i) => {
        const c = ['#22c55e','#f59e0b','#ef4444'][i];
        const count = arrLahan.filter(l=>l.status===s).length;
        return `<div style="display:flex;align-items:center;gap:6px">
          <div style="width:10px;height:10px;border-radius:50%;background:${c}"></div>
          <span style="font-size:11px;color:var(--text-secondary)">${s} (${count})</span>
        </div>`;
      }).join('')}
      <div style="margin-left:auto;font-size:11px;color:var(--text-muted)">
        ${arrLahan.filter(l=>l.lat&&l.lng).length}/${arrLahan.length} blok terpetakan
      </div>
    </div>
    <div id="dashboardMiniMap" style="height:300px;width:100%"></div>
  </div>

  <!-- Lower Row -->
  <div class="grid-2" style="margin-bottom:22px">
    <!-- Alerts lokal -->
    <div class="card">
      <div class="section-title">Notifikasi & Peringatan</div>
      ${[
        { jenis:'warning', pesan:'Pantau kadar air tanah secara berkala untuk mencegah kekeringan.', waktu:'Otomatis' },
        { jenis:'info',    pesan:'Sistem AgroSmart siap digunakan. Tambahkan data lahan dan tanaman Anda.', waktu:'Otomatis' },
        { jenis:'success', pesan:'Selamat datang! Data Anda aman tersimpan di cloud Supabase.', waktu:'Sekarang' },
      ].map(a => `
        <div class="alert alert-${a.jenis === 'danger' ? 'danger' : a.jenis === 'warning' ? 'warning' : a.jenis === 'success' ? 'success' : 'info'}">
          <span class="alert-icon">${a.jenis==='danger'?'🚨':a.jenis==='warning'?'⚠️':a.jenis==='success'?'✅':'ℹ️'}</span>
          <div><div style="font-weight:600">${a.pesan}</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px">${a.waktu}</div></div>
        </div>
      `).join('')}
    </div>

    <!-- Aktivitas -->
    <div class="card">
      <div class="section-title">Aktivitas Terbaru</div>
      <div class="timeline">
        ${arrAktivitas.length > 0 ? arrAktivitas.map(a => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-title">${a.judul}</div>
              <div class="timeline-time">${new Date(a.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
              <div class="timeline-desc">${a.deskripsi||''}</div>
            </div>
          </div>
        `).join('') : '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">Belum ada aktivitas tercatat.</div>'}
      </div>
    </div>
  </div>

  <!-- Lahan Status -->
  <div class="card">
    <div class="section-title">Status Lahan</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Blok</th><th>Tanaman</th><th>Luas (ha)</th>
            <th>Kelembaban</th><th>pH Tanah</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${arrLahan.map(l => `
            <tr>
              <td><strong>${l.nama}</strong> <span style="font-size:11px;color:var(--text-muted)">${(l.lokasi||'').split(',')[0]}</span></td>
              <td>${l.tanaman||'-'}</td>
              <td>${l.luas||0} ha</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="progress-wrap" style="flex:1;height:6px"><div class="progress-bar" style="width:${l.kelembaban||0}%;background:${(l.kelembaban||0)<50?'linear-gradient(90deg,#ef4444,#f87171)':'linear-gradient(90deg,#22c55e,#34d399)'}"></div></div>
                  <span style="font-size:11px;color:var(--text-secondary);white-space:nowrap">${l.kelembaban||0}%</span>
                </div>
              </td>
              <td>${l.ph||'-'}</td>
              <td><span class="badge ${l.status==='Aktif'?'badge-green':l.status==='Pemeliharaan'?'badge-yellow':'badge-blue'}"><span class="badge-dot"></span>${l.status||'-'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  `;
}

async function initDashboardCharts() {
  const chartColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();

  const { data: listTanaman } = await SB.tanaman.fetch();
  arrTanaman = listTanaman || [];

  // Produksi Bar Chart
  const ctxP = document.getElementById('chartProduksi');
  if (ctxP && !ctxP._chart) {
    ctxP._chart = new Chart(ctxP, {
      type: 'bar',
      data: {
        labels: arrTanaman.map(t => t.nama),
        datasets: [{
          label: 'Produksi (ton)',
          data: arrTanaman.map(t => ((t.hasil_kg||0)/1000).toFixed(1)),
          backgroundColor: ['#16a34a','#059669','#0d9488','#15803d','#166534','#14532d','#365314','#713f12'],
          borderRadius: 8, borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6b7d70', font: { size: 10 }, maxRotation: 30 } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7d70', font: { size: 10 } } }
        }
      }
    });
  }

  // Tren Line Chart
  const ctxT = document.getElementById('chartTren');
  if (ctxT && !ctxT._chart) {
    const labels = ['5 Mar','6 Mar','7 Mar','8 Mar','9 Mar','10 Mar','11 Mar'];
    ctxT._chart = new Chart(ctxT, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Total Panen (ton)',
          data: [12.4, 15.1, 18.3, 14.7, 16.9, 21.2, 19.0],
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.1)',
          borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#22c55e',
          fill: true, tension: 0.4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6b7d70', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7d70', font: { size: 10 } } }
        }
      }
    });
  }
}

// ── Inject Dummy Data for New Empty Accounts ─────────────────────────────────────
window.injectDummyData = async function(btn) {
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:8px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;"></span> Menyuntikkan Data...';
  
  const uid = window._currentUserId;
  if (!uid) {
    showToast('error', 'Gagal', 'Sesi login tidak valid.');
    btn.disabled = false;
    btn.innerHTML = '✨ Isi Data Sampel (Dummy)';
    return;
  }

  try {
    // 1. Lahan
    const { error: errLahan } = await sb.from('lahan').insert([
      { user_id: uid, nama: 'Blok A - Lembang', lokasi: 'Lembang, Jawa Barat', luas: 2.5, jenis: 'Terbuka', status: 'Aktif', tanaman: 'Tomat, Cabai', suhu: 24.5, kelembaban: 78, ph: 6.5, emoji: '🏔️', lat: -6.8142, lng: 107.6186 },
      { user_id: uid, nama: 'Blok B - Ciwidey', lokasi: 'Ciwidey, Jawa Barat', luas: 4.0, jenis: 'Greenhouse', status: 'Aktif', tanaman: 'Stroberi', suhu: 21.0, kelembaban: 85, ph: 6.2, emoji: '🍓', lat: -7.0853, lng: 107.3941 },
      { user_id: uid, nama: 'Blok C - Pangalengan', lokasi: 'Pangalengan, Jawa Barat', luas: 5.5, jenis: 'Terbuka', status: 'Aktif', tanaman: 'Kentang', suhu: 20.2, kelembaban: 80, ph: 6.8, emoji: '🥔', lat: -7.1895, lng: 107.5623 }
    ]);
    if (errLahan) throw errLahan;

    // 2. Tanaman
    const { error: errTanaman } = await sb.from('tanaman').insert([
      { user_id: uid, nama: 'Tomat Cherry', latin: 'Solanum lycopersicum', emoji: '🍅', kategori: 'Sayuran', lahan: 'Blok A - Lembang', luas: 1.0, status: 'Masa Panen', umur: '60 hari', hasil_kg: 450, catatan: 'Pertumbuhan normal' },
      { user_id: uid, nama: 'Cabai Rawit', latin: 'Capsicum frutescens', emoji: '🌶️', kategori: 'Sayuran', lahan: 'Blok A - Lembang', luas: 1.5, status: 'Vegetatif', umur: '30 hari', hasil_kg: 0, catatan: 'Baru dipupuk minggu lalu' },
      { user_id: uid, nama: 'Stroberi Mencir', latin: 'Fragaria × ananassa', emoji: '🍓', kategori: 'Buah', lahan: 'Blok B - Ciwidey', luas: 4.0, status: 'Masa Panen', umur: '90 hari', hasil_kg: 1200, catatan: 'Perlu pestisida organik' },
      { user_id: uid, nama: 'Kentang Granola', latin: 'Solanum tuberosum', emoji: '🥔', kategori: 'Umbi', lahan: 'Blok C - Pangalengan', luas: 5.5, status: 'Generatif', umur: '45 hari', hasil_kg: 0, catatan: 'Hujan intens' }
    ]);
    if (errTanaman) throw errTanaman;

    // 3. Karyawan
    const { error: errKaryawan } = await sb.from('karyawan').insert([
      { user_id: uid, nama: 'Ujang Surahman', jabatan: 'Kepala Kebun', divisi: 'Blok A', gaji: 3500000, kehadiran: 100, tugas: 'Mengawasi Blok A', status: 'Aktif' },
      { user_id: uid, nama: 'Asep Mulyana', jabatan: 'Pekerja Lepas', divisi: 'Blok B', gaji: 2500000, kehadiran: 95, tugas: 'Penyiraman dan Panen', status: 'Aktif' },
      { user_id: uid, nama: 'Siti Nurbaya', jabatan: 'Quality Control', divisi: 'Semua Blok', gaji: 3200000, kehadiran: 98, tugas: 'Sortasi Hasil Panen', status: 'Aktif' }
    ]);
    if (errKaryawan) throw errKaryawan;

    // 4. Panen
    const { error: errPanen } = await sb.from('panen').insert([
      { user_id: uid, tanaman: 'Tomat Cherry', lahan: 'Blok A - Lembang', jumlah: 50, satuan: 'kg', kualitas: 'A', harga: 15000, karyawan: 'Asep Mulyana' },
      { user_id: uid, tanaman: 'Tomat Cherry', lahan: 'Blok A - Lembang', jumlah: 45, satuan: 'kg', kualitas: 'B', harga: 12000, karyawan: 'Asep Mulyana' },
      { user_id: uid, tanaman: 'Stroberi Mencir', lahan: 'Blok B - Ciwidey', jumlah: 120, satuan: 'kg', kualitas: 'Super', harga: 50000, karyawan: 'Siti Nurbaya' }
    ]);
    if (errPanen) throw errPanen;

    // 5. Biaya
    const { error: errBiaya } = await sb.from('biaya').insert([
      { user_id: uid, lahan: 'Blok A - Lembang', kategori: 'Pupuk', deskripsi: 'Pupuk NPK Mutiara', jumlah: 50, satuan: 'kg', harga_satuan: 12000 },
      { user_id: uid, lahan: 'Blok B - Ciwidey', kategori: 'Pestisida', deskripsi: 'Pestisida Organik', jumlah: 5, satuan: 'liter', harga_satuan: 80000 },
      { user_id: uid, lahan: 'Blok C - Pangalengan', kategori: 'Gaji', deskripsi: 'Gaji Buruh Harian', jumlah: 3, satuan: 'orang', harga_satuan: 100000 }
    ]);
    if (errBiaya) throw errBiaya;

    // 6. Aktivitas
    const { error: errAct } = await sb.from('aktivitas').insert([
      { user_id: uid, judul: 'Penanaman Selesai', deskripsi: 'Selesai menanam bibit cabai di Blok A sejumlah 500 bedeng.' },
      { user_id: uid, judul: 'Pemberian Pupuk Pertama', deskripsi: 'NPK diaplikasikan ke semua bibit baru Blok C pada pagi hari hujan rintik.' }
    ]);
    if (errAct) throw errAct;

    showToast('success', 'Selesai!', 'Data dummy berhasil dimasukkan. Memuat ulang...');
    setTimeout(() => { window.location.reload(); }, 1500);

  } catch (err) {
    showToast('error', 'Gagal', err.message);
    btn.disabled = false;
    btn.innerHTML = '✨ Coba Lagi';
  }
};
