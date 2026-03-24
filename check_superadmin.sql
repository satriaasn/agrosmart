-- ============================================================
--  AgroSmart — Diagnostic & Fix Superadmin
--  Email target: satriadestrian@gmail.com
--  Jalankan SATU per SATU di Supabase SQL Editor
-- ============================================================

-- ── STEP 1: Cek user di auth.users ─────────────────────────
-- Jalankan ini dulu. Lihat apakah user ada & sudah confirmed.
SELECT
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'satriadestrian@gmail.com';

-- ── STEP 2: Cek profile ─────────────────────────────────────
-- Pastikan role = 'superadmin' dan tidak suspended
SELECT
  p.id,
  p.email,
  p.role,
  p.nama_pemilik,
  p.is_suspended,
  p.onboarding_done,
  p.license_plan,
  p.created_at
FROM public.profiles p
WHERE p.email = 'satriadestrian@gmail.com'
   OR p.id IN (
     SELECT id FROM auth.users WHERE email = 'satriadestrian@gmail.com'
   );

-- ── STEP 3 (JIKA PERLU): Fix role ke superadmin ─────────────
-- Jalankan jika role bukan 'superadmin' atau profile tidak ada
DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'satriadestrian@gmail.com';

  IF v_uid IS NULL THEN
    RAISE NOTICE 'User tidak ditemukan di auth.users. Daftar dulu via UI!';
    RETURN;
  END IF;

  -- Pastikan profile ada dengan role superadmin
  INSERT INTO public.profiles (id, role, onboarding_done, license_plan)
  VALUES (v_uid, 'superadmin', TRUE, 'enterprise')
  ON CONFLICT (id) DO UPDATE SET
    role            = 'superadmin',
    onboarding_done = TRUE,
    license_plan    = 'enterprise',
    is_suspended    = FALSE;

  RAISE NOTICE 'Berhasil: User % sudah di-set sebagai superadmin.', v_uid;
END;
$$;

-- ── STEP 4 (JIKA PERLU): Reset password via Supabase Auth ───
-- Jalankan ini untuk reset password jadi: SuperAdmin2026!
-- Catatan: ini hanya bisa via Supabase Dashboard →
--   Authentication → Users → cari email → klik ... → Reset Password
--   atau via fungsi admin API berikut:
SELECT
  'Untuk reset password: buka Supabase Dashboard → Authentication → Users → cari satriadestrian@gmail.com → ⋮ → Send Reset Password Email'
  AS instruksi;

-- ── STEP 5: Verifikasi akhir ─────────────────────────────────
SELECT
  u.email,
  u.email_confirmed_at IS NOT NULL AS email_verified,
  u.last_sign_in_at,
  p.role,
  p.is_suspended,
  p.onboarding_done,
  p.license_plan
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'satriadestrian@gmail.com';
