-- ============================================================
--  AgroSmart — SQL PATCH: Tambah kolom baru ke tabel profiles
--  Untuk fitur Edit Profil: jenis_usaha, telepon, bio, logo_url
--  (Data yang ada TIDAK akan terhapus)
-- ============================================================

-- Tambah kolom jenis_usaha (opsional)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS jenis_usaha TEXT DEFAULT NULL;

-- Tambah kolom telepon (opsional)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS telepon TEXT DEFAULT NULL;

-- Tambah kolom deskripsi / bio (opsional)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS deskripsi TEXT DEFAULT NULL;

-- Tambah kolom logo_url untuk foto profil/logo usaha (opsional)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

-- Selesai. Kolom baru sudah ditambahkan.
SELECT 'OK: kolom jenis_usaha, telepon, deskripsi, logo_url berhasil ditambahkan ke profiles' as status;
