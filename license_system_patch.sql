-- ============================================================
--  AgroSmart — License System Patch
--  Jalankan di Supabase SQL Editor
--  AMAN: Tidak menghapus data yang sudah ada!
-- ============================================================

-- ── 1. Tambah kolom lisensi ke tabel profiles ────────────────
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS license_key       TEXT,
  ADD COLUMN IF NOT EXISTS license_plan      TEXT NOT NULL DEFAULT 'trial'
    CHECK (license_plan IN ('trial','pro','enterprise','suspended')),
  ADD COLUMN IF NOT EXISTS license_expires   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS max_operators     INT NOT NULL DEFAULT 1;

-- ── 2. Tabel Lisensi (dikelola superadmin) ───────────────────
CREATE TABLE IF NOT EXISTS public.licenses (
  id              BIGSERIAL PRIMARY KEY,
  license_key     TEXT UNIQUE NOT NULL,
  plan_type       TEXT NOT NULL DEFAULT 'pro'
    CHECK (plan_type IN ('trial','pro','enterprise')),
  owner_id        UUID REFERENCES auth.users ON DELETE SET NULL,
  owner_email     TEXT,
  max_operators   INT  NOT NULL DEFAULT 3,
  valid_days      INT  NOT NULL DEFAULT 365,          -- durasi lisensi dalam hari
  valid_until     TIMESTAMPTZ,                         -- diisi saat aktivasi
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_used         BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at    TIMESTAMPTZ
);

-- ── 3. RLS untuk tabel licenses ──────────────────────────────
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Superadmin bisa lihat & kelola semua license
CREATE POLICY "lic_superadmin_all" ON public.licenses 
  FOR ALL USING (public.is_superadmin());

-- Owner hanya bisa lihat license miliknya
CREATE POLICY "lic_owner_select" ON public.licenses 
  FOR SELECT USING (owner_id = auth.uid());

-- ── 4. Function: Generate License Key ───────────────────────
-- Format: AGRO-XXXX-XXXX-XXXX (16 chars random uppercase alphanumeric)
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'AGRO-';
  i INT;
  r INT;
BEGIN
  FOR g IN 1..3 LOOP
    FOR i IN 1..4 LOOP
      r := floor(random() * length(chars) + 1)::INT;
      result := result || substr(chars, r, 1);
    END LOOP;
    IF g < 3 THEN result := result || '-'; END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- ── 5. Function: Activate License Key (dipanggil dari frontend owner) ─────
CREATE OR REPLACE FUNCTION public.activate_license(p_key TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  lic RECORD;
  expires TIMESTAMPTZ;
BEGIN
  -- Cari license key yang valid dan belum dipakai
  SELECT * INTO lic FROM public.licenses
  WHERE license_key = UPPER(TRIM(p_key))
    AND is_active = TRUE
    AND is_used = FALSE
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kode lisensi tidak valid atau sudah digunakan.');
  END IF;

  -- Hitung tanggal expiry
  expires := NOW() + (lic.valid_days || ' days')::INTERVAL;

  -- Update license record
  UPDATE public.licenses SET
    is_used      = TRUE,
    owner_id     = auth.uid(),
    owner_email  = (SELECT email FROM auth.users WHERE id = auth.uid()),
    valid_until  = expires,
    activated_at = NOW()
  WHERE id = lic.id;

  -- Update profile user
  UPDATE public.profiles SET
    license_key     = UPPER(TRIM(p_key)),
    license_plan    = lic.plan_type,
    license_expires = expires,
    max_operators   = lic.max_operators
  WHERE id = auth.uid();

  RETURN jsonb_build_object(
    'success',   true,
    'plan',      lic.plan_type,
    'expires',   expires,
    'max_ops',   lic.max_operators,
    'message',   'Lisensi berhasil diaktifkan!'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_license(TEXT) TO authenticated;

-- ── 6. Function: Check License Status ───────────────────────
CREATE OR REPLACE FUNCTION public.get_my_license_status()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  p RECORD;
  trial_days_left INT;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'unknown');
  END IF;

  -- Jika punya lisensi aktif
  IF p.license_plan IN ('pro', 'enterprise') THEN
    IF p.license_expires IS NULL OR p.license_expires > NOW() THEN
      RETURN jsonb_build_object(
        'status',   'active',
        'plan',     p.license_plan,
        'expires',  p.license_expires,
        'max_ops',  p.max_operators
      );
    ELSE
      RETURN jsonb_build_object('status', 'expired', 'plan', p.license_plan);
    END IF;
  END IF;

  -- Hitung sisa hari trial (default 14 hari)
  trial_days_left := 14 - EXTRACT(DAY FROM (NOW() - p.trial_started_at))::INT;
  
  IF trial_days_left > 0 THEN
    RETURN jsonb_build_object(
      'status',          'trial',
      'plan',            'trial',
      'days_remaining',  trial_days_left
    );
  ELSE
    RETURN jsonb_build_object('status', 'trial_expired', 'plan', 'trial');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_license_status() TO authenticated;

-- ── 7. Superadmin: view untuk join profile + license info ────
-- View untuk admin panel query
CREATE OR REPLACE VIEW public.admin_user_license_view AS
SELECT
  p.id,
  p.email,
  p.nama_usaha,
  p.nama_pemilik,
  p.role,
  p.is_suspended,
  p.onboarding_done,
  p.license_plan,
  p.license_key,
  p.license_expires,
  p.max_operators,
  p.trial_started_at,
  p.created_at,
  -- Hitung status lisensi
  CASE
    WHEN p.license_plan IN ('pro','enterprise') AND (p.license_expires IS NULL OR p.license_expires > NOW()) THEN 'active'
    WHEN p.license_plan IN ('pro','enterprise') AND p.license_expires <= NOW() THEN 'expired'
    WHEN (14 - EXTRACT(DAY FROM (NOW() - p.trial_started_at))::INT) > 0 THEN 'trial'
    ELSE 'trial_expired'
  END AS license_status,
  GREATEST(0, 14 - EXTRACT(DAY FROM (NOW() - p.trial_started_at))::INT) AS trial_days_left
FROM public.profiles p
ORDER BY p.created_at DESC;

-- Hanya superadmin yang bisa akses view ini
GRANT SELECT ON public.admin_user_license_view TO authenticated;

-- ============================================================
-- SELESAI — Jalankan di Supabase SQL Editor
-- Setelah berhasil, refresh Admin Panel untuk melihat tab Lisensi
-- ============================================================
