/* =============================================
   AgroSmart — Export Data ke Excel (.xlsx)
   Mendukung export semua data & transaksi dalam format
   multi-sheet Excel berkualitas tinggi.
   ============================================= */

'use strict';

/**
 * Pastikan library SheetJS (XLSX) tersedia
 */
async function ensureXLSX() {
  if (typeof XLSX !== 'undefined') return true;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'xlsx.full.min.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      // Fallback ke CDN
      const cdnScript = document.createElement('script');
      cdnScript.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      cdnScript.onload = () => resolve(true);
      cdnScript.onerror = () => reject(new Error('Gagal memuat library Excel (SheetJS). Periksa koneksi internet Anda.'));
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(script);
  });
}

/**
 * Menghitung lebar kolom otomatis berdasarkan panjang teks terpanjang
 */
function autoFitColumns(worksheet, aoaData) {
  const colWidths = [];
  aoaData.forEach(row => {
    if (!Array.isArray(row)) return;
    row.forEach((cell, colIdx) => {
      const valStr = (cell === null || cell === undefined) ? '' : String(cell);
      // Jangan hitung baris judul besar yang memanjang
      if (valStr.length > 60 && colIdx === 0 && row.length <= 2) return;
      const len = valStr.length;
      if (!colWidths[colIdx] || len > colWidths[colIdx]) {
        colWidths[colIdx] = len;
      }
    });
  });
  worksheet['!cols'] = colWidths.map(w => ({ wch: Math.min(Math.max((w || 8) + 4, 11), 45) }));
}

/**
 * Format tanggal YYYY-MM-DD ke format lokal Indonesia
 */
function formatTglIndo(tglStr) {
  if (!tglStr) return '-';
  try {
    const d = new Date(tglStr);
    if (isNaN(d.getTime())) return tglStr;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return tglStr;
  }
}

/**
 * Helper untuk fetch data yang aman (mendukung Postgrest thenable tanpa .catch)
 */
async function safeFetch(fetchCall) {
  try {
    if (!fetchCall) return { data: [] };
    const res = await (typeof fetchCall === 'function' ? fetchCall() : fetchCall);
    return res || { data: [] };
  } catch (err) {
    console.warn('safeFetch caught error:', err);
    return { data: [] };
  }
}

/**
 * Tarik seluruh data dari Supabase dengan fallback ke DB lokal jika demo/offline
 */
async function fetchFullExportData(seasonFilter = 'all') {
  let [
    resKas,
    resBiaya,
    resPanen,
    resTanaman,
    resLahan,
    resKaryawan,
    resCOA,
    resSeasons
  ] = await Promise.all([
    safeFetch(() => (typeof SB !== 'undefined' && SB.cash_book?.fetch) ? SB.cash_book.fetch() : null),
    safeFetch(() => (typeof SB !== 'undefined' && SB.biaya?.fetch) ? SB.biaya.fetch() : null),
    safeFetch(() => (typeof SB !== 'undefined' && SB.panen?.fetch) ? SB.panen.fetch() : null),
    safeFetch(() => (typeof SB !== 'undefined' && SB.tanaman?.fetch) ? SB.tanaman.fetch() : null),
    safeFetch(() => (typeof SB !== 'undefined' && SB.lahan?.fetch) ? SB.lahan.fetch() : null),
    safeFetch(() => (typeof SB !== 'undefined' && SB.karyawan?.fetch) ? SB.karyawan.fetch() : null),
    safeFetch(() => (typeof SB !== 'undefined' && SB.coa?.fetch) ? SB.coa.fetch() : null),
    safeFetch(() => (typeof SB !== 'undefined' && SB.seasons?.fetch) ? SB.seasons.fetch() : null),
  ]);

  let kas = resKas?.data || [];
  let biaya = resBiaya?.data || [];
  let panen = resPanen?.data || [];
  let tanaman = resTanaman?.data || [];
  let lahan = resLahan?.data || [];
  let karyawan = resKaryawan?.data || [];
  let coa = resCOA?.data || [];
  let seasons = resSeasons?.data || [];

  // Fallback ke demo data (DB) jika database Supabase kosong (misal saat mode preview/demo lokal)
  if (typeof DB !== 'undefined') {
    if (!tanaman.length && DB.tanaman) tanaman = DB.tanaman;
    if (!lahan.length && DB.lahan) lahan = DB.lahan;
    if (!karyawan.length && DB.karyawan) karyawan = DB.karyawan;
    if (!panen.length && DB.panen) panen = DB.panen;
    if (!biaya.length && DB.biaya) biaya = DB.biaya;
  }

  // Filter berdasarkan periode tanam jika diminta
  let seasonLabel = 'Semua Periode (All Time)';
  if (seasonFilter === 'active' && window.APP_SEASON_ID) {
    const activeId = String(window.APP_SEASON_ID);
    seasonLabel = window.APP_SEASON ? `Periode Aktif: ${window.APP_SEASON.nama}` : `Periode ID: ${activeId}`;
    panen = panen.filter(p => String(p.season_id) === activeId);
    biaya = biaya.filter(b => String(b.season_id) === activeId);
    kas = kas.filter(k => !k.season_id || String(k.season_id) === activeId);
  } else if (seasonFilter && seasonFilter !== 'all' && seasonFilter !== 'active') {
    const sId = String(seasonFilter);
    const foundSeason = seasons.find(s => String(s.id) === sId);
    seasonLabel = foundSeason ? foundSeason.nama : `Periode ID: ${sId}`;
    panen = panen.filter(p => String(p.season_id) === sId);
    biaya = biaya.filter(b => String(b.season_id) === sId);
    kas = kas.filter(k => !k.season_id || String(k.season_id) === sId);
  }

  // Profil pengguna / nama usaha
  let profileName = 'AgroSmart Farm';
  let ownerName = '-';
  try {
    const user = await (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
    if (user && sb) {
      const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (prof) {
        profileName = prof.nama_usaha || profileName;
        ownerName = prof.nama_lengkap || user.email || '-';
      }
    }
  } catch (err) {
    console.warn('Gagal membaca profil untuk header export:', err);
  }

  return {
    kas,
    biaya,
    panen,
    tanaman,
    lahan,
    karyawan,
    coa,
    seasons,
    metadata: {
      profileName,
      ownerName,
      seasonLabel,
      exportedAt: new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }),
      timestampFile: new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)
    }
  };
}

/**
 * 1. Sheet Ringkasan Eksekutif
 */
function createRingkasanSheet(dataset) {
  const { kas, biaya, panen, tanaman, lahan, karyawan, metadata } = dataset;
  const MULTIPLIERS = window.APP_MULTIPLIERS || { 'kg': 1, 'ton': 1000, 'kwintal': 100, 'gram': 0.001, 'liter': 1, 'buah': 1, 'ikat': 1 };

  const totalKasMasuk = kas.filter(k => k.tipe === 'masuk').reduce((a, b) => a + (Number(b.jumlah) || 0), 0);
  const totalKasKeluar = kas.filter(k => k.tipe === 'keluar').reduce((a, b) => a + (Number(b.jumlah) || 0), 0);
  const saldoKas = totalKasMasuk - totalKasKeluar;

  const totalBiayaOperasional = biaya.reduce((a, b) => a + (Number(b.total) || 0), 0);
  const totalPendapatanPanen = panen.reduce((a, p) => a + (Number(p.total) || 0), 0);
  const labaKotorPanen = totalPendapatanPanen - totalBiayaOperasional;

  const totalKgPanen = panen.reduce((a, p) => {
    const mult = MULTIPLIERS[(p.satuan || 'kg').toLowerCase()] || 1;
    return a + ((Number(p.jumlah) || 0) * mult);
  }, 0);

  const totalLuasLahan = lahan.reduce((a, l) => a + (Number(l.luas) || 0), 0);
  const totalBebanGaji = karyawan.reduce((a, k) => a + (Number(k.gaji) || 0), 0);

  const aoa = [
    ['🌿 AGROSMART — SISTEM KONTROL PERKEBUNAN & PERTANIAN'],
    ['LAPORAN EKSEKUTIF SEMUA DATA & TRANSAKSI'],
    [],
    ['INFORMASI DOKUMEN', ''],
    ['Nama Usaha / Kebun', metadata.profileName],
    ['Pemilik / Akun', metadata.ownerName],
    ['Cakupan Periode', metadata.seasonLabel],
    ['Waktu Ekspor', metadata.exportedAt],
    ['Status Dokumen', 'Data Terverifikasi (Sistem AgroSmart)'],
    [],
    ['RINGKASAN ARUS KAS & KEUANGAN (REAL CASH)', '', 'KETERANGAN'],
    ['Total Arus Kas Masuk', totalKasMasuk, 'Total penerimaan uang kas real'],
    ['Total Arus Kas Keluar', totalKasKeluar, 'Total pengeluaran uang kas real'],
    ['Saldo Kas Berjalan', saldoKas, 'Saldo bersih kas saat ini'],
    [],
    ['ANALISIS LABA KOTOR OPERASIONAL LAPANGAN', '', 'KETERANGAN'],
    ['Total Nilai Penjualan Panen', totalPendapatanPanen, 'Bruto pendapatan dari hasil panen'],
    ['Total Biaya Olah Lahan & Pemeliharaan', totalBiayaOperasional, 'Modal bibit, pupuk, pestisida, upah, alat'],
    ['Laba Kotor Operasional Kebun', labaKotorPanen, 'Selisih Pendapatan Panen dikurangi Biaya Lahan'],
    ['Margin Operasional Kebun', totalPendapatanPanen > 0 ? ((labaKotorPanen / totalPendapatanPanen) * 100).toFixed(2) + '%' : '0%', 'Tingkat profitabilitas panen'],
    [],
    ['RINGKASAN ASET, PRODUKSI & TENAGA KERJA', '', 'SATUAN'],
    ['Total Luas Lahan Terkelola', totalLuasLahan, 'Hektar (ha)'],
    ['Jumlah Blok Lahan', lahan.length, 'Blok'],
    ['Jumlah Varietas / Komoditas Tanaman', tanaman.length, 'Varietas'],
    ['Total Akumulasi Hasil Panen', Math.round(totalKgPanen), 'Kilogram (Kg)'],
    ['Total Setara Tonase Panen', (totalKgPanen / 1000).toFixed(2), 'Ton'],
    ['Jumlah Karyawan / Tenaga Kerja', karyawan.length, 'Orang'],
    ['Total Estimasi Beban Gaji Bulanan', totalBebanGaji, 'Rupiah / Bulan'],
    ['Total Transaksi Jurnal Kas Tercatat', kas.length, 'Baris Transaksi'],
    ['Total Catatan Biaya Lapangan', biaya.length, 'Pos Pengeluaran'],
    ['Total Sesi / Catatan Panen', panen.length, 'Aktivitas Panen'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  autoFitColumns(ws, aoa);
  return ws;
}

/**
 * 2. Sheet Buku Kas (Cash Book Transactions)
 */
function createKasSheet(kasList, coaList) {
  const coaMap = {};
  (coaList || []).forEach(c => {
    if (c.id) coaMap[c.id] = c;
    if (c.account_code) coaMap[c.account_code] = c;
  });

  const headers = [
    'No',
    'Tanggal',
    'Tipe',
    'Kode Akun',
    'Nama Akun',
    'Kategori',
    'Deskripsi Transaksi',
    'Terkait Blok Lahan',
    'Tipe Referensi',
    'Uang Masuk (Rp)',
    'Uang Keluar (Rp)',
    'Nominal Transaksi (Rp)'
  ];

  const rows = [headers];
  let totMasuk = 0;
  let totKeluar = 0;

  kasList.forEach((k, idx) => {
    const isMasuk = k.tipe === 'masuk';
    const jml = Number(k.jumlah) || 0;
    if (isMasuk) totMasuk += jml;
    else totKeluar += jml;

    const coaItem = (k.coa_id ? coaMap[k.coa_id] : null) || (k.account_code ? coaMap[k.account_code] : null);

    rows.push([
      idx + 1,
      k.tanggal || '-',
      (k.tipe || '').toUpperCase(),
      coaItem?.account_code || '-',
      coaItem?.account_name || '-',
      k.kategori || '-',
      k.deskripsi || '-',
      k.lahan || 'Umum (Semua Lahan)',
      k.ref_type ? `${k.ref_type} ${k.ref_id ? '#' + k.ref_id : ''}` : 'Manual',
      isMasuk ? jml : 0,
      !isMasuk ? jml : 0,
      jml
    ]);
  });

  // Baris Total di bagian bawah
  rows.push([]);
  rows.push([
    'TOTAL ARUS KAS',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totMasuk,
    totKeluar,
    totMasuk - totKeluar
  ]);
  rows.push([
    'SALDO BERSIH KAS',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totMasuk - totKeluar
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  autoFitColumns(ws, rows);
  return ws;
}

/**
 * 3. Sheet Biaya Olah Lahan (Operational Expenses)
 */
function createBiayaSheet(biayaList, seasonsList) {
  const seasonMap = {};
  (seasonsList || []).forEach(s => { seasonMap[s.id] = s.nama; });

  const headers = [
    'No',
    'Tanggal',
    'Blok Lahan',
    'Kategori Biaya',
    'Deskripsi Kegiatan / Barang',
    'Volume / Kuantitas',
    'Satuan',
    'Harga Satuan (Rp)',
    'Total Biaya (Rp)',
    'Periode Tanam'
  ];

  const rows = [headers];
  let totalBiaya = 0;

  biayaList.forEach((b, idx) => {
    const tot = Number(b.total) || 0;
    totalBiaya += tot;
    rows.push([
      idx + 1,
      b.tanggal || '-',
      b.lahan || 'Umum',
      b.kategori || '-',
      b.deskripsi || '-',
      Number(b.jumlah) || 0,
      b.satuan || '-',
      Number(b.hargaSatuan) || 0,
      tot,
      (b.season_id && seasonMap[b.season_id]) ? seasonMap[b.season_id] : (b.season_id ? `ID: ${b.season_id}` : 'Semua Periode')
    ]);
  });

  // Total
  rows.push([]);
  rows.push([
    'TOTAL BIAYA OPERASIONAL',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalBiaya,
    ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  autoFitColumns(ws, rows);
  return ws;
}

/**
 * 4. Sheet Hasil Panen (Harvest Records)
 */
function createPanenSheet(panenList, seasonsList) {
  const seasonMap = {};
  (seasonsList || []).forEach(s => { seasonMap[s.id] = s.nama; });

  const headers = [
    'No',
    'Tanggal Panen',
    'Blok Lahan',
    'Komoditas Tanaman',
    'Jumlah Panen',
    'Satuan',
    'Kualitas / Grade',
    'Harga Jual Satuan (Rp)',
    'Total Nilai Penjualan (Rp)',
    'Pembeli / Pengepul',
    'Petugas / Karyawan',
    'Periode Tanam'
  ];

  const rows = [headers];
  let totalPendapatan = 0;
  let totalJumlahPanen = 0;

  panenList.forEach((p, idx) => {
    const tot = Number(p.total) || 0;
    const jml = Number(p.jumlah) || 0;
    totalPendapatan += tot;
    totalJumlahPanen += jml;

    rows.push([
      idx + 1,
      p.tanggal || '-',
      p.lahan || '-',
      p.tanaman || '-',
      jml,
      p.satuan || 'kg',
      p.kualitas || 'Grade A',
      Number(p.harga) || 0,
      tot,
      p.pembeli || '-',
      p.karyawan || '-',
      (p.season_id && seasonMap[p.season_id]) ? seasonMap[p.season_id] : (p.season_id ? `ID: ${p.season_id}` : 'Semua Periode')
    ]);
  });

  // Total
  rows.push([]);
  rows.push([
    'TOTAL HASIL PANEN & PENJUALAN',
    '',
    '',
    '',
    totalJumlahPanen,
    'Akumulasi Qty',
    '',
    '',
    totalPendapatan,
    '',
    '',
    ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  autoFitColumns(ws, rows);
  return ws;
}

/**
 * 5. Sheet Data Tanaman (Crops Catalog)
 */
function createTanamanSheet(tanamanList) {
  const headers = [
    'No',
    'Nama Tanaman',
    'Nama Latin / Ilmiah',
    'Kategori Tanaman',
    'Penempatan Blok Lahan',
    'Luas Area (ha)',
    'Umur Tanaman',
    'Status Pertumbuhan',
    'Estimasi / Hasil Panen (kg)',
    'Catatan Pemeliharaan / Modal'
  ];

  const rows = [headers];
  tanamanList.forEach((t, idx) => {
    rows.push([
      idx + 1,
      t.nama || '-',
      t.latin || '-',
      t.kategori || '-',
      t.lahan || '-',
      Number(t.luas) || 0,
      t.umur || '-',
      t.status || 'Aktif',
      Number(t.hasilKg) || 0,
      t.modal || '-'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  autoFitColumns(ws, rows);
  return ws;
}

/**
 * 6. Sheet Data Lahan (Land Blocks)
 */
function createLahanSheet(lahanList) {
  const headers = [
    'No',
    'Nama Blok Lahan',
    'Lokasi / Desa',
    'Luas (ha)',
    'Jenis Lahan',
    'Status Operasional',
    'Komoditas Utama',
    'pH Tanah',
    'Suhu (°C)',
    'Kelembaban (%)',
    'Koordinat GPS',
    'Link Google Maps'
  ];

  const rows = [headers];
  lahanList.forEach((l, idx) => {
    const gps = (l.lat && l.lng) ? `${l.lat}, ${l.lng}` : '-';
    rows.push([
      idx + 1,
      l.nama || '-',
      l.lokasi || '-',
      Number(l.luas) || 0,
      l.jenis || '-',
      l.status || 'Aktif',
      l.tanaman || '-',
      l.ph !== undefined ? Number(l.ph) : '-',
      l.suhu !== undefined ? Number(l.suhu) : '-',
      l.kelembaban !== undefined ? Number(l.kelembaban) : '-',
      gps,
      l.mapsUrl || (l.lat && l.lng ? `https://maps.google.com/?q=${l.lat},${l.lng}` : '-')
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  autoFitColumns(ws, rows);
  return ws;
}

/**
 * 7. Sheet Data Karyawan (Employees & Payroll)
 */
function createKaryawanSheet(karyawanList) {
  const headers = [
    'No',
    'Nama Lengkap',
    'Jabatan',
    'Divisi',
    'Gaji Pokok (Rp)',
    'Kehadiran (%)',
    'Tugas / Penugasan Lapangan',
    'Status Kerja',
    'Tanggal Bergabung'
  ];

  const rows = [headers];
  let totalGaji = 0;

  karyawanList.forEach((k, idx) => {
    const gaji = Number(k.gaji) || 0;
    totalGaji += gaji;
    rows.push([
      idx + 1,
      k.nama || '-',
      k.jabatan || '-',
      k.divisi || '-',
      gaji,
      k.kehadiran !== undefined ? Number(k.kehadiran) : 100,
      k.tugas || '-',
      k.status || 'Aktif',
      k.bergabung ? formatTglIndo(k.bergabung) : '-'
    ]);
  });

  rows.push([]);
  rows.push([
    'TOTAL BEBAN GAJI',
    '',
    '',
    '',
    totalGaji,
    '',
    '',
    '',
    ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  autoFitColumns(ws, rows);
  return ws;
}

/**
 * 8. Sheet Daftar Akun (Chart of Accounts)
 */
function createCOASheet(coaList) {
  const headers = [
    'No',
    'Kode Akun',
    'Nama Akun',
    'Kategori Akun',
    'Tipe Saldo Normal',
    'Saldo Berjalan (Rp)'
  ];

  const rows = [headers];
  coaList.forEach((c, idx) => {
    rows.push([
      idx + 1,
      c.account_code || '-',
      c.account_name || '-',
      c.account_type || c.type || '-',
      c.normal_balance || 'Debit',
      Number(c.balance) || 0
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  autoFitColumns(ws, rows);
  return ws;
}

/**
 * =========================================================================
 * FUNGSI UTAMA EXPORT WORKBOOK KE FILE EXCEL (.XLSX)
 * =========================================================================
 */
async function exportToExcel(exportType = 'all', seasonFilter = 'all') {
  try {
    // 1. Tampilkan notifikasi proses
    if (typeof showToast === 'function') {
      showToast('info', 'Menyiapkan Data...', 'Sedang mengumpulkan data transaksi dan menyusun file Excel...');
    }

    // 2. Pastikan library XLSX aktif
    await ensureXLSX();

    // 3. Tarik seluruh dataset
    const dataset = await fetchFullExportData(seasonFilter);
    const wb = XLSX.utils.book_new();

    let defaultFilename = '';
    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    if (exportType === 'all') {
      // MASTER EXPORT: 8 Sheet Lengkap
      XLSX.utils.book_append_sheet(wb, createRingkasanSheet(dataset), 'Ringkasan');
      XLSX.utils.book_append_sheet(wb, createKasSheet(dataset.kas, dataset.coa), 'Buku Kas');
      XLSX.utils.book_append_sheet(wb, createBiayaSheet(dataset.biaya, dataset.seasons), 'Biaya Lahan');
      XLSX.utils.book_append_sheet(wb, createPanenSheet(dataset.panen, dataset.seasons), 'Hasil Panen');
      XLSX.utils.book_append_sheet(wb, createTanamanSheet(dataset.tanaman), 'Data Tanaman');
      XLSX.utils.book_append_sheet(wb, createLahanSheet(dataset.lahan), 'Data Lahan');
      XLSX.utils.book_append_sheet(wb, createKaryawanSheet(dataset.karyawan), 'Data Karyawan');
      if (dataset.coa && dataset.coa.length) {
        XLSX.utils.book_append_sheet(wb, createCOASheet(dataset.coa), 'Daftar Akun COA');
      }

      defaultFilename = `AgroSmart_Semua_Data_dan_Transaksi_${dateTag}.xlsx`;
    } 
    else if (exportType === 'kas') {
      XLSX.utils.book_append_sheet(wb, createKasSheet(dataset.kas, dataset.coa), 'Buku Kas');
      if (dataset.coa && dataset.coa.length) {
        XLSX.utils.book_append_sheet(wb, createCOASheet(dataset.coa), 'Daftar Akun');
      }
      defaultFilename = `AgroSmart_Buku_Kas_${dateTag}.xlsx`;
    } 
    else if (exportType === 'biaya' || exportType === 'keuangan') {
      XLSX.utils.book_append_sheet(wb, createBiayaSheet(dataset.biaya, dataset.seasons), 'Biaya Olah Lahan');
      defaultFilename = `AgroSmart_Biaya_Olah_Lahan_${dateTag}.xlsx`;
    } 
    else if (exportType === 'panen') {
      XLSX.utils.book_append_sheet(wb, createPanenSheet(dataset.panen, dataset.seasons), 'Hasil Panen');
      defaultFilename = `AgroSmart_Catatan_Panen_${dateTag}.xlsx`;
    } 
    else if (exportType === 'lahan_tanaman') {
      XLSX.utils.book_append_sheet(wb, createTanamanSheet(dataset.tanaman), 'Data Tanaman');
      XLSX.utils.book_append_sheet(wb, createLahanSheet(dataset.lahan), 'Data Lahan');
      defaultFilename = `AgroSmart_Master_Tanaman_Lahan_${dateTag}.xlsx`;
    } 
    else if (exportType === 'karyawan') {
      XLSX.utils.book_append_sheet(wb, createKaryawanSheet(dataset.karyawan), 'Data Karyawan');
      defaultFilename = `AgroSmart_Data_Karyawan_${dateTag}.xlsx`;
    }

    // 4. Trigger download file
    XLSX.writeFile(wb, defaultFilename);

    if (typeof showToast === 'function') {
      showToast('success', 'Export Excel Berhasil!', `File ${defaultFilename} berhasil diunduh.`);
    }

    // Tutup modal jika sedang terbuka
    if (typeof closeModal === 'function') {
      closeModal();
    }

    return true;
  } catch (err) {
    console.error('Error saat export Excel:', err);
    if (typeof showToast === 'function') {
      showToast('danger', 'Export Gagal', err.message || 'Terjadi kesalahan saat mengekspor data.');
    } else {
      alert('Gagal mengekspor data ke Excel: ' + err.message);
    }
    return false;
  }
}

/**
 * =========================================================================
 * MODAL DIALOG PILIHAN EXPORT EXCEL
 * =========================================================================
 */
function openExportExcelModal(preselectedType = 'all') {
  // Ambil periode tanam aktif jika ada
  const activeSeasonName = window.APP_SEASON ? window.APP_SEASON.nama : null;

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:18px;">
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:12px 14px;display:flex;align-items:flex-start;gap:12px">
        <div style="font-size:24px;line-height:1">📊</div>
        <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.5">
          Ekspor data operasional dan keuangan perkebunan Anda ke dalam format <b>Microsoft Excel (.xlsx)</b>. File dapat dibuka langsung di Excel, Google Sheets, atau aplikasi spreadsheet lainnya.
        </div>
      </div>

      <!-- Pilihan Jenis Data -->
      <div>
        <label class="form-label" style="font-weight:700;margin-bottom:8px;display:block">Pilih Data yang Akan Diekspor:</label>
        <div style="display:grid;grid-template-columns:1fr;gap:8px">
          
          <label class="export-type-card ${preselectedType === 'all' ? 'active' : ''}" style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg-secondary);transition:all 0.2s">
            <input type="radio" name="exportTargetType" value="all" ${preselectedType === 'all' ? 'checked' : ''} style="margin-top:3px" onchange="highlightExportChoice(this)">
            <div>
              <div style="font-weight:700;font-size:13.5px;color:var(--text-primary);display:flex;align-items:center;gap:6px">
                📦 Semua Data & Transaksi (Rekomendasi Master)
                <span class="badge badge-green" style="font-size:10px;padding:2px 6px">8 Sheet Lengkap</span>
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:3px">
                Mencakup Ringkasan Eksekutif, Buku Kas, Biaya Olah Lahan, Hasil Panen, Tanaman, Lahan, Karyawan, dan Daftar Akun.
              </div>
            </div>
          </label>

          <label class="export-type-card ${preselectedType === 'kas' ? 'active' : ''}" style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg-secondary);transition:all 0.2s">
            <input type="radio" name="exportTargetType" value="kas" ${preselectedType === 'kas' ? 'checked' : ''} style="margin-top:3px" onchange="highlightExportChoice(this)">
            <div>
              <div style="font-weight:700;font-size:13.5px;color:var(--text-primary)">
                💰 Buku Kas & Arus Kas Nyata
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:3px">
                Jurnal transaksi uang masuk, keluar, saldo, kategori, dan pemetaan kode akun (COA).
              </div>
            </div>
          </label>

          <label class="export-type-card ${preselectedType === 'biaya' || preselectedType === 'keuangan' ? 'active' : ''}" style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg-secondary);transition:all 0.2s">
            <input type="radio" name="exportTargetType" value="biaya" ${preselectedType === 'biaya' || preselectedType === 'keuangan' ? 'checked' : ''} style="margin-top:3px" onchange="highlightExportChoice(this)">
            <div>
              <div style="font-weight:700;font-size:13.5px;color:var(--text-primary)">
                💸 Biaya Olah Lahan & Pemeliharaan
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:3px">
                Rincian pos pengeluaran pupuk, upah, pestisida, sewa mesin, transportasi per blok lahan.
              </div>
            </div>
          </label>

          <label class="export-type-card ${preselectedType === 'panen' ? 'active' : ''}" style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg-secondary);transition:all 0.2s">
            <input type="radio" name="exportTargetType" value="panen" ${preselectedType === 'panen' ? 'checked' : ''} style="margin-top:3px" onchange="highlightExportChoice(this)">
            <div>
              <div style="font-weight:700;font-size:13.5px;color:var(--text-primary)">
                🌾 Catatan & Penjualan Hasil Panen
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:3px">
                Volume panen, kualitas grade, harga jual, total nominal, serta penanggung jawab panen.
              </div>
            </div>
          </label>

          <label class="export-type-card ${preselectedType === 'lahan_tanaman' ? 'active' : ''}" style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg-secondary);transition:all 0.2s">
            <input type="radio" name="exportTargetType" value="lahan_tanaman" ${preselectedType === 'lahan_tanaman' ? 'checked' : ''} style="margin-top:3px" onchange="highlightExportChoice(this)">
            <div>
              <div style="font-weight:700;font-size:13.5px;color:var(--text-primary)">
                🌱 Master Blok Lahan & Tanaman
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:3px">
                Inventaris blok lahan, luas (ha), koordinat GPS, jenis komoditas, dan status pertumbuhan.
              </div>
            </div>
          </label>

          <label class="export-type-card ${preselectedType === 'karyawan' ? 'active' : ''}" style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg-secondary);transition:all 0.2s">
            <input type="radio" name="exportTargetType" value="karyawan" ${preselectedType === 'karyawan' ? 'checked' : ''} style="margin-top:3px" onchange="highlightExportChoice(this)">
            <div>
              <div style="font-weight:700;font-size:13.5px;color:var(--text-primary)">
                👷 Data Tenaga Kerja / Karyawan
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:3px">
                Daftar staf kebun, jabatan, divisi, penugasan, persentase kehadiran, dan gaji.
              </div>
            </div>
          </label>

        </div>
      </div>

      <!-- Filter Periode -->
      <div>
        <label class="form-label" style="font-weight:700;margin-bottom:6px;display:block">Filter Periode Tanam:</label>
        <select id="exportSeasonFilter" class="form-control" style="width:100%">
          <option value="all">Semua Periode (Rekap Keseluruhan Waktu)</option>
          ${activeSeasonName ? `<option value="active" selected>Periode Aktif Saja (${activeSeasonName})</option>` : ''}
        </select>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
          Filter ini akan membatasi transaksi Panen, Biaya Lahan, dan Buku Kas sesuai periode yang dipilih.
        </div>
      </div>

      <!-- Tombol Eksekusi -->
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:10px;padding-top:14px;border-top:1px solid var(--border)">
        <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
        <button class="btn btn-success" id="btnDoExport" onclick="triggerExcelDownload(this)" style="display:inline-flex;align-items:center;gap:8px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Unduh File Excel (.xlsx)
        </button>
      </div>
    </div>
  `;

  if (typeof openModal === 'function') {
    openModal('Export Data ke Excel (.xlsx)', modalHtml);
    // Sembunyikan default footer bawaan karena modalHtml sudah memiliki tombol aksi sendiri
    const defaultFooter = document.getElementById('modalFooter');
    if (defaultFooter) defaultFooter.style.display = 'none';
  }
}

/**
 * Helper untuk highlight tampilan radio card
 */
function highlightExportChoice(radioEl) {
  document.querySelectorAll('.export-type-card').forEach(el => {
    el.style.borderColor = 'var(--border)';
    el.style.background = 'var(--bg-secondary)';
  });
  if (radioEl && radioEl.closest('.export-type-card')) {
    const card = radioEl.closest('.export-type-card');
    card.style.borderColor = '#16a34a';
    card.style.background = 'rgba(22,163,74,0.08)';
  }
}

/**
 * Handle klik unduh dari modal
 */
async function triggerExcelDownload(btnEl) {
  const selectedTypeEl = document.querySelector('input[name="exportTargetType"]:checked');
  const type = selectedTypeEl ? selectedTypeEl.value : 'all';

  const seasonFilterEl = document.getElementById('exportSeasonFilter');
  const seasonFilter = seasonFilterEl ? seasonFilterEl.value : 'all';

  // Ubah status tombol jadi loading
  const originalText = btnEl.innerHTML;
  btnEl.disabled = true;
  btnEl.innerHTML = `
    <span class="spinner" style="width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block"></span>
    Membuat File Excel...
  `;

  try {
    await exportToExcel(type, seasonFilter);
  } finally {
    btnEl.disabled = false;
    btnEl.innerHTML = originalText;
  }
}

