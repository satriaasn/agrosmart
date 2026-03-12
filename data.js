/* =============================================
   AgroSmart — Sample Data Store
   ============================================= */

const DB = {
  tanaman: [
    { id:1, nama:'Kelapa Sawit', latin:'Elaeis guineensis', emoji:'🌴', kategori:'Palma', lahan:'Blok A', luas:45, status:'Aktif', umur:'3 thn', hasilKg:12500, modal:'Pemupukan sebulan sekali' },
    { id:2, nama:'Karet',        latin:'Hevea brasiliensis', emoji:'🌲', kategori:'Lateks', lahan:'Blok B', luas:30, status:'Aktif', umur:'5 thn', hasilKg:8200, modal:'Sadap setiap 2 hari' },
    { id:3, nama:'Kakao',        latin:'Theobroma cacao',   emoji:'🍫', kategori:'Buah',   lahan:'Blok C', luas:20, status:'Aktif', umur:'4 thn', hasilKg:4100, modal:'Pemangkasan bulanan' },
    { id:4, nama:'Kopi Robusta', latin:'Coffea canephora',  emoji:'☕', kategori:'Buah',   lahan:'Blok D', luas:15, status:'Aktif', umur:'6 thn', hasilKg:2900, modal:'Panen per 6 bulan' },
    { id:5, nama:'Tebu',         latin:'Saccharum officinarum', emoji:'🎍', kategori:'Gula', lahan:'Blok E', luas:25, status:'Pemeliharaan', umur:'1 thn', hasilKg:18000, modal:'Irigasi mingguan' },
    { id:6, nama:'Singkong',     latin:'Manihot esculenta', emoji:'🌿', kategori:'Umbi',   lahan:'Blok F', luas:10, status:'Panen', umur:'8 bln', hasilKg:6500, modal:'Panen 8-10 bulan' },
    { id:7, nama:'Padi',         latin:'Oryza sativa',      emoji:'🌾', kategori:'Serealia', lahan:'Blok G', luas:18, status:'Aktif', umur:'3 bln', hasilKg:5400, modal:'Panen per 3 bulan' },
    { id:8, nama:'Jagung',       latin:'Zea mays',          emoji:'🌽', kategori:'Serealia', lahan:'Blok H', luas:12, status:'Aktif', umur:'2 bln', hasilKg:4800, modal:'Panen 90 hari' },
  ],

  lahan: [
    { id:1, nama:'Blok A', lokasi:'Desa Tanjung, Kalimantan', luas:45, jenis:'Perkebunan', status:'Aktif', tanaman:'Kelapa Sawit', suhu:27, kelembaban:78, ph:6.2, emoji:'🏔️', lat:-0.5238, lng:113.9213, mapsUrl:'https://maps.google.com/?q=-0.5238,113.9213' },
    { id:2, nama:'Blok B', lokasi:'Desa Rimba, Kalimantan',   luas:30, jenis:'Perkebunan', status:'Aktif', tanaman:'Karet',        suhu:28, kelembaban:80, ph:5.8, emoji:'🌿', lat:-0.7812, lng:114.0934, mapsUrl:'https://maps.google.com/?q=-0.7812,114.0934' },
    { id:3, nama:'Blok C', lokasi:'Desa Sari, Sumatra',       luas:20, jenis:'Perkebunan', status:'Aktif', tanaman:'Kakao',        suhu:26, kelembaban:75, ph:6.5, emoji:'🏞️', lat:0.5070,  lng:101.4478, mapsUrl:'https://maps.google.com/?q=0.5070,101.4478' },
    { id:4, nama:'Blok D', lokasi:'Desa Makmur, Sumatra',     luas:15, jenis:'Agrowisata', status:'Aktif', tanaman:'Kopi Robusta', suhu:22, kelembaban:70, ph:6.0, emoji:'⛰️', lat:0.3285,  lng:101.6017, mapsUrl:'https://maps.google.com/?q=0.3285,101.6017' },
    { id:5, nama:'Blok E', lokasi:'Desa Jaya, Jawa',          luas:25, jenis:'Pertanian',  status:'Pemeliharaan', tanaman:'Tebu',  suhu:30, kelembaban:65, ph:7.0, emoji:'🌾', lat:-6.9147, lng:107.6098, mapsUrl:'https://maps.google.com/?q=-6.9147,107.6098' },
    { id:6, nama:'Blok F', lokasi:'Desa Lestari, Jawa',       luas:10, jenis:'Pertanian',  status:'Aktif', tanaman:'Singkong',    suhu:29, kelembaban:72, ph:6.8, emoji:'🌱', lat:-7.1022, lng:107.7748, mapsUrl:'https://maps.google.com/?q=-7.1022,107.7748' },
    { id:7, nama:'Blok G', lokasi:'Desa Subur, Sulawesi',     luas:18, jenis:'Pertanian',  status:'Aktif', tanaman:'Padi',        suhu:28, kelembaban:85, ph:6.3, emoji:'🌊', lat:-1.4306, lng:120.7654, mapsUrl:'https://maps.google.com/?q=-1.4306,120.7654' },
    { id:8, nama:'Blok H', lokasi:'Desa Makmur, Sulawesi',    luas:12, jenis:'Pertanian',  status:'Aktif', tanaman:'Jagung',      suhu:31, kelembaban:61, ph:6.9, emoji:'☀️', lat:-1.6198, lng:120.9121, mapsUrl:'https://maps.google.com/?q=-1.6198,120.9121' },
  ],


  karyawan: [
    { id:1,  nama:'Ahmad Fauzi',    jabatan:'Mandor Kebun',    divisi:'Operasional', gaji:5500000,  kehadiran:96, tugas:'Kelapa Sawit - Blok A', status:'Aktif', bergabung:'2019-03-10' },
    { id:2,  nama:'Siti Rahayu',    jabatan:'Ahli Agronomi',   divisi:'Teknis',      gaji:8000000,  kehadiran:98, tugas:'Penelitian Varietas',    status:'Aktif', bergabung:'2018-07-01' },
    { id:3,  nama:'Budi Santoso',   jabatan:'Operator Alat',   divisi:'Operasional', gaji:4800000,  kehadiran:91, tugas:'Panen Mekanis',          status:'Aktif', bergabung:'2020-01-15' },
    { id:4,  nama:'Dewi Lestari',   jabatan:'Admin Lapangan',  divisi:'Administrasi',gaji:4200000,  kehadiran:99, tugas:'Pencatatan Produksi',    status:'Aktif', bergabung:'2021-05-20' },
    { id:5,  nama:'Suwarto',        jabatan:'Pekerja Harian',  divisi:'Operasional', gaji:3500000,  kehadiran:85, tugas:'Pemupukan Blok B',       status:'Aktif', bergabung:'2022-08-01' },
    { id:6,  nama:'Sri Mulyani',    jabatan:'Pekerja Harian',  divisi:'Operasional', gaji:3500000,  kehadiran:88, tugas:'Penyiangan Blok C',      status:'Aktif', bergabung:'2022-08-01' },
    { id:7,  nama:'Hendra Wijaya',  jabatan:'Supervisor',      divisi:'Teknis',      gaji:7000000,  kehadiran:95, tugas:'Pengawasan Blok D-H',    status:'Aktif', bergabung:'2020-06-10' },
    { id:8,  nama:'Rina Kartika',   jabatan:'Ahli Hama',       divisi:'Teknis',      gaji:6500000,  kehadiran:97, tugas:'Pengendalian Hama',      status:'Aktif', bergabung:'2019-11-01' },
    { id:9,  nama:'Joko Purnomo',   jabatan:'Sopir Truk',      divisi:'Logistik',    gaji:4500000,  kehadiran:93, tugas:'Distribusi Hasil Panen',  status:'Aktif', bergabung:'2021-02-14' },
    { id:10, nama:'Maya Sari',      jabatan:'Kasir Kebun',     divisi:'Keuangan',    gaji:5000000,  kehadiran:100,tugas:'Pengelolaan Keuangan',   status:'Cuti',  bergabung:'2020-09-01' },
  ],

  panen: [
    { id:1,  tanaman:'Kelapa Sawit', lahan:'Blok A', tanggal:'2026-03-01', jumlah:4200, satuan:'kg', kualitas:'A', harga:2800, total:11760000, karyawan:'Ahmad Fauzi' },
    { id:2,  tanaman:'Karet',        lahan:'Blok B', tanggal:'2026-03-02', jumlah:980,  satuan:'kg', kualitas:'A', harga:18500,total:18130000, karyawan:'Suwarto' },
    { id:3,  tanaman:'Kakao',        lahan:'Blok C', tanggal:'2026-03-03', jumlah:620,  satuan:'kg', kualitas:'B', harga:45000,total:27900000, karyawan:'Sri Mulyani' },
    { id:4,  tanaman:'Kopi Robusta', lahan:'Blok D', tanggal:'2026-03-05', jumlah:340,  satuan:'kg', kualitas:'A', harga:35000,total:11900000, karyawan:'Hendra Wijaya' },
    { id:5,  tanaman:'Tebu',         lahan:'Blok E', tanggal:'2026-03-07', jumlah:8500, satuan:'kg', kualitas:'A', harga:1200, total:10200000, karyawan:'Budi Santoso' },
    { id:6,  tanaman:'Singkong',     lahan:'Blok F', tanggal:'2026-03-08', jumlah:2100, satuan:'kg', kualitas:'B', harga:2500, total:5250000,  karyawan:'Ahmad Fauzi' },
    { id:7,  tanaman:'Padi',         lahan:'Blok G', tanggal:'2026-03-10', jumlah:1800, satuan:'kg', kualitas:'A', harga:5500, total:9900000,  karyawan:'Suwarto' },
    { id:8,  tanaman:'Jagung',       lahan:'Blok H', tanggal:'2026-03-11', jumlah:1500, satuan:'kg', kualitas:'A', harga:4200, total:6300000,  karyawan:'Budi Santoso' },
  ],

  alerts: [
    { jenis:'warning', pesan:'Kadar air tanah Blok E di bawah 40%. Perlu irigasi segera.', waktu:'2 jam lalu' },
    { jenis:'danger',  pesan:'Terdeteksi serangan hama kutu putih di Blok C (Kakao).', waktu:'5 jam lalu' },
    { jenis:'success', pesan:'Panen Kelapa Sawit Blok A selesai. Total 4.2 ton.', waktu:'Kemarin' },
    { jenis:'info',    pesan:'Jadwal pemupukan Blok B dijadwalkan besok pagi.', waktu:'Kemarin' },
  ],

  aktivitas: [
    { judul:'Panen Jagung Blok H', waktu:'Hari ini, 08:30', desc:'1.500 kg berhasil dipanen oleh tim Budi Santoso.' },
    { judul:'Pemupukan Blok D',    waktu:'Hari ini, 07:00', desc:'Pemupukan NPK 50 kg dilakukan sesuai jadwal.' },
    { judul:'Serangan hama Blok C',waktu:'Kemarin, 14:20',  desc:'Ditemukan kutu putih pada tanaman kakao, sedang ditangani.' },
    { judul:'Panen Padi Blok G',   waktu:'10 Mar, 09:00',   desc:'1.800 kg gabah padi dipanen dan disimpan di gudang.' },
    { judul:'Rekrut 2 pekerja baru',waktu:'8 Mar, 10:00',  desc:'2 pekerja harian bergabung untuk musim panen.' },
  ],

  // ── Biaya Operasional per Lahan ─────────────────────────────────────────────
  // kategori: Pupuk | Pestisida | Tenaga Kerja | Irigasi | Alat & Mesin | Transportasi | Lainnya
  biaya: [
    { id:1,  lahan:'Blok A', tanggal:'2026-03-01', kategori:'Pupuk',         deskripsi:'Pupuk NPK 25 kg',          jumlah:25,  satuan:'kg',   hargaSatuan:18000,  total:450000  },
    { id:2,  lahan:'Blok A', tanggal:'2026-03-02', kategori:'Tenaga Kerja',  deskripsi:'Upah 3 pekerja harian',    jumlah:3,   satuan:'orang',hargaSatuan:120000, total:360000  },
    { id:3,  lahan:'Blok A', tanggal:'2026-03-05', kategori:'Pestisida',     deskripsi:'Insektisida Regent 1L',    jumlah:1,   satuan:'liter',hargaSatuan:85000,  total:85000   },
    { id:4,  lahan:'Blok A', tanggal:'2026-03-08', kategori:'Alat & Mesin',  deskripsi:'BBM traktor',              jumlah:20,  satuan:'liter',hargaSatuan:10000,  total:200000  },
    { id:5,  lahan:'Blok A', tanggal:'2026-03-10', kategori:'Transportasi',  deskripsi:'Ongkos angkut ke pabrik',  jumlah:4.2, satuan:'ton',  hargaSatuan:150000, total:630000  },
    { id:6,  lahan:'Blok B', tanggal:'2026-03-01', kategori:'Pupuk',         deskripsi:'Urea 20 kg',               jumlah:20,  satuan:'kg',   hargaSatuan:12000,  total:240000  },
    { id:7,  lahan:'Blok B', tanggal:'2026-03-02', kategori:'Tenaga Kerja',  deskripsi:'Upah penorehan karet',     jumlah:5,   satuan:'orang',hargaSatuan:130000, total:650000  },
    { id:8,  lahan:'Blok B', tanggal:'2026-03-04', kategori:'Alat & Mesin',  deskripsi:'Pisau sadap & mangkuk',    jumlah:10,  satuan:'set',  hargaSatuan:35000,  total:350000  },
    { id:9,  lahan:'Blok B', tanggal:'2026-03-07', kategori:'Irigasi',       deskripsi:'Pompa air – sewa harian',  jumlah:2,   satuan:'hari', hargaSatuan:200000, total:400000  },
    { id:10, lahan:'Blok C', tanggal:'2026-03-01', kategori:'Pupuk',         deskripsi:'Pupuk organik kompos',     jumlah:50,  satuan:'kg',   hargaSatuan:5000,   total:250000  },
    { id:11, lahan:'Blok C', tanggal:'2026-03-03', kategori:'Pestisida',     deskripsi:'Fungisida Dithane 1 kg',   jumlah:2,   satuan:'kg',   hargaSatuan:75000,  total:150000  },
    { id:12, lahan:'Blok C', tanggal:'2026-03-03', kategori:'Tenaga Kerja',  deskripsi:'Upah pemetik kakao',       jumlah:6,   satuan:'orang',hargaSatuan:110000, total:660000  },
    { id:13, lahan:'Blok D', tanggal:'2026-03-02', kategori:'Pupuk',         deskripsi:'Pupuk NPK & ZA campur',    jumlah:15,  satuan:'kg',   hargaSatuan:20000,  total:300000  },
    { id:14, lahan:'Blok D', tanggal:'2026-03-05', kategori:'Tenaga Kerja',  deskripsi:'Upah petik kopi',          jumlah:4,   satuan:'orang',hargaSatuan:125000, total:500000  },
    { id:15, lahan:'Blok D', tanggal:'2026-03-06', kategori:'Alat & Mesin',  deskripsi:'Sewa mesin pulper kopi',   jumlah:1,   satuan:'unit', hargaSatuan:500000, total:500000  },
    { id:16, lahan:'Blok E', tanggal:'2026-03-01', kategori:'Irigasi',       deskripsi:'Biaya pompa irigasi tebu', jumlah:5,   satuan:'hari', hargaSatuan:250000, total:1250000 },
    { id:17, lahan:'Blok E', tanggal:'2026-03-04', kategori:'Pupuk',         deskripsi:'Pupuk ZA tebu 40 kg',      jumlah:40,  satuan:'kg',   hargaSatuan:9000,   total:360000  },
    { id:18, lahan:'Blok E', tanggal:'2026-03-07', kategori:'Tenaga Kerja',  deskripsi:'Upah potong tebu',         jumlah:8,   satuan:'orang',hargaSatuan:140000, total:1120000 },
    { id:19, lahan:'Blok F', tanggal:'2026-03-02', kategori:'Tenaga Kerja',  deskripsi:'Upah panen singkong',      jumlah:4,   satuan:'orang',hargaSatuan:110000, total:440000  },
    { id:20, lahan:'Blok F', tanggal:'2026-03-03', kategori:'Transportasi',  deskripsi:'Angkut singkong ke pasar', jumlah:2.1, satuan:'ton',  hargaSatuan:100000, total:210000  },
    { id:21, lahan:'Blok G', tanggal:'2026-03-08', kategori:'Pupuk',         deskripsi:'Pupuk urea padi 30 kg',    jumlah:30,  satuan:'kg',   hargaSatuan:10000,  total:300000  },
    { id:22, lahan:'Blok G', tanggal:'2026-03-10', kategori:'Alat & Mesin',  deskripsi:'Sewa mesin combine padi', jumlah:1,   satuan:'hari', hargaSatuan:1200000,total:1200000 },
    { id:23, lahan:'Blok G', tanggal:'2026-03-10', kategori:'Tenaga Kerja',  deskripsi:'Upah pembantu panen padi', jumlah:5,   satuan:'orang',hargaSatuan:110000, total:550000  },
    { id:24, lahan:'Blok H', tanggal:'2026-03-09', kategori:'Pupuk',         deskripsi:'Pupuk NPK jagung 20 kg',   jumlah:20,  satuan:'kg',   hargaSatuan:15000,  total:300000  },
    { id:25, lahan:'Blok H', tanggal:'2026-03-11', kategori:'Tenaga Kerja',  deskripsi:'Upah panen jagung',        jumlah:4,   satuan:'orang',hargaSatuan:110000, total:440000  },
    { id:26, lahan:'Blok H', tanggal:'2026-03-11', kategori:'Transportasi',  deskripsi:'Angkut jagung ke gudang',  jumlah:1.5, satuan:'ton',  hargaSatuan:80000,  total:120000  },
  ]
};
