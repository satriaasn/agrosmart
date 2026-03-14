-- ============================================================
--  AgroSmart — Supabase Full Database Reset & Clean Schema
--  Jalankan seluruh script ini di Supabase SQL Editor
--  PERINGATAN: SCRIPT INI MENGHAPUS SEMUA DATA SEBELUMNYA!
-- ============================================================

-- ── 0. PERSIAPAN (HAPUS DATA LAMA) ──────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_my_operator(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.my_owner_id() CASCADE;

DROP TABLE IF EXISTS public.aktivitas CASCADE;
DROP TABLE IF EXISTS public.biaya CASCADE;
DROP TABLE IF EXISTS public.panen CASCADE;
DROP TABLE IF EXISTS public.karyawan CASCADE;
DROP TABLE IF EXISTS public.tanaman CASCADE;
DROP TABLE IF EXISTS public.lahan CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ── 1. PROFILES (Akun & Usaha) ──────────────────────────────
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('superadmin','owner','operator')),
  nama_usaha      TEXT,
  nama_pemilik    TEXT,
  jenis_usaha     TEXT,
  alamat          TEXT,
  telepon         TEXT,
  logo_url        TEXT,
  deskripsi       TEXT,
  website         TEXT,
  is_suspended    BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. TEAM MEMBERS (Operator per-Owner) ────────────────────
CREATE TABLE public.team_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users ON DELETE SET NULL,
  invited_email TEXT NOT NULL,
  role_label    TEXT NOT NULL DEFAULT 'Operator',
  permissions   JSONB NOT NULL DEFAULT '{
    "dashboard":true, "lahan":true, "tanaman":true, "karyawan":true, "panen":true,
    "keuangan":false, "laporan":true, "cuaca":true, "peta":true, "edit":true, "hapus":false
  }',
  temp_password TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id, invited_email)
);

-- ── 3. LAHAN ────────────────────────────────────────────────
CREATE TABLE public.lahan (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nama        TEXT NOT NULL,
  lokasi      TEXT,
  luas        NUMERIC,
  jenis       TEXT DEFAULT 'Perkebunan',
  status      TEXT DEFAULT 'Aktif',
  tanaman     TEXT DEFAULT '-',
  suhu        NUMERIC DEFAULT 28,
  kelembaban  NUMERIC DEFAULT 70,
  ph          NUMERIC DEFAULT 6.5,
  emoji       TEXT DEFAULT '🌿',
  lat         NUMERIC,
  lng         NUMERIC,
  maps_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. TANAMAN ──────────────────────────────────────────────
CREATE TABLE public.tanaman (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nama        TEXT NOT NULL,
  latin       TEXT,
  emoji       TEXT DEFAULT '🌿',
  kategori    TEXT,
  lahan       TEXT,
  luas        NUMERIC,
  status      TEXT DEFAULT 'Aktif',
  umur        TEXT,
  hasil_kg    NUMERIC DEFAULT 0,
  catatan     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. KARYAWAN ─────────────────────────────────────────────
CREATE TABLE public.karyawan (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nama        TEXT NOT NULL,
  jabatan     TEXT,
  divisi      TEXT,
  gaji        NUMERIC DEFAULT 0,
  kehadiran   NUMERIC DEFAULT 100,
  tugas       TEXT,
  status      TEXT DEFAULT 'Aktif',
  bergabung   DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. PANEN ────────────────────────────────────────────────
CREATE TABLE public.panen (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tanaman     TEXT,
  lahan       TEXT,
  tanggal     DATE NOT NULL DEFAULT CURRENT_DATE,
  jumlah      NUMERIC DEFAULT 0,
  satuan      TEXT DEFAULT 'kg',
  kualitas    TEXT DEFAULT 'A',
  harga       NUMERIC DEFAULT 0,
  total       NUMERIC GENERATED ALWAYS AS (jumlah * harga) STORED,
  karyawan    TEXT,
  catatan     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. BIAYA OPERASIONAL ────────────────────────────────────
CREATE TABLE public.biaya (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  lahan         TEXT NOT NULL,
  tanggal       DATE NOT NULL DEFAULT CURRENT_DATE,
  kategori      TEXT NOT NULL,
  deskripsi     TEXT,
  jumlah        NUMERIC DEFAULT 0,
  satuan        TEXT DEFAULT 'kg',
  harga_satuan  NUMERIC DEFAULT 0,
  total         NUMERIC GENERATED ALWAYS AS (jumlah * harga_satuan) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. AKTIVITAS LOG ────────────────────────────────────────
CREATE TABLE public.aktivitas (
  id        BIGSERIAL PRIMARY KEY,
  user_id   UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  judul     TEXT NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. TRIGGER AUTHENTICATION (Otomatis buat profil) ────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
  v_onboarding_done BOOLEAN;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'owner');
  
  -- If role is 'operator', they don't need to do onboarding (setup business)
  -- because they are joining an existing one.
  v_onboarding_done := (v_role = 'operator');

  INSERT INTO public.profiles (id, nama_pemilik, role, onboarding_done)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    v_onboarding_done
  )
  ON CONFLICT (id) DO UPDATE 
  SET role = EXCLUDED.role,
      onboarding_done = EXCLUDED.onboarding_done;
      
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fungsi pembantu timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_lahan_updated_at BEFORE UPDATE ON public.lahan FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 10. HELPER FUNCTIONS ─────────────────────────────────────
-- Cek apakah user adalah operator aktif dari owner tertentu
CREATE OR REPLACE FUNCTION public.is_my_operator(owner_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE owner_id = owner_uuid AND user_id = auth.uid() AND status = 'active'
  )
$$;

-- Cek apakah user adalah superadmin
-- SECURITY DEFINER: function ini berjalan sebagai pemilik function (postgres),
-- bukan sebagai user yang memanggil, sehingga menghindari infinite recursion di RLS
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT role = 'superadmin' FROM public.profiles WHERE id = auth.uid()),
    FALSE
  )
$$;

-- ── OPERATOR HELPERS ───────────────────────────────────────

-- Function to safely check if an email + temp_password combination is valid
CREATE OR REPLACE FUNCTION public.check_operator_invite(p_email TEXT, p_password TEXT)
RETURNS TABLE (
    id UUID,
    owner_id UUID,
    role_label TEXT,
    permissions JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
BEGIN
    RETURN QUERY
    SELECT tm.id, tm.owner_id, tm.role_label, tm.permissions
    FROM public.team_members tm
    WHERE tm.invited_email = LOWER(p_email)
      AND tm.temp_password = p_password
      AND tm.status = 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_operator_invite(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_operator_invite(TEXT, TEXT) TO authenticated;

-- Link team member to auth user and clear temp password
CREATE OR REPLACE FUNCTION public.link_team_member(p_invite_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.team_members
    SET user_id = auth.uid(),
        status = 'active',
        temp_password = NULL
    WHERE id = p_invite_id 
      AND status = 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_team_member(UUID) TO authenticated;

-- ── 11. ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tanaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karyawan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biaya ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aktivitas ENABLE ROW LEVEL SECURITY;

-- RLS: Profiles
-- PENTING: Policy superadmin tidak boleh query tabel profiles (infinite recursion!)
-- Gunakan function is_superadmin() yang SECURITY DEFINER untuk menghindari loop
CREATE POLICY "superadmin_profiles_select" ON public.profiles FOR SELECT USING (
  public.is_superadmin()
);
-- User biasa: hanya lihat profil sendiri dan profil owner mereka (operator context)
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (
  auth.uid() = id OR
  id IN (SELECT owner_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Superadmin update (suspend/role change)
CREATE POLICY "superadmin_profiles_update" ON public.profiles FOR UPDATE USING (
  public.is_superadmin()
);

-- RLS: Team_members
CREATE POLICY "tm_owner_all" ON public.team_members FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "tm_operator_read" ON public.team_members FOR SELECT USING (auth.uid() = user_id);

-- RLS: Modul Operasional
-- LAHAN: owner, operator aktif, atau superadmin
CREATE POLICY "lahan_select" ON public.lahan FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "lahan_insert" ON public.lahan FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "lahan_update" ON public.lahan FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "lahan_delete" ON public.lahan FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- TANAMAN
CREATE POLICY "tanaman_select" ON public.tanaman FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "tanaman_insert" ON public.tanaman FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "tanaman_update" ON public.tanaman FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "tanaman_delete" ON public.tanaman FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- KARYAWAN
CREATE POLICY "karyawan_select" ON public.karyawan FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "karyawan_insert" ON public.karyawan FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "karyawan_update" ON public.karyawan FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "karyawan_delete" ON public.karyawan FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- PANEN
CREATE POLICY "panen_select" ON public.panen FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "panen_insert" ON public.panen FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "panen_update" ON public.panen FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "panen_delete" ON public.panen FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- BIAYA
CREATE POLICY "biaya_select" ON public.biaya FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "biaya_insert" ON public.biaya FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "biaya_update" ON public.biaya FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "biaya_delete" ON public.biaya FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- AKTIVITAS
CREATE POLICY "aktivitas_select" ON public.aktivitas FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id));
CREATE POLICY "aktivitas_insert" ON public.aktivitas FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id));
CREATE POLICY "aktivitas_delete" ON public.aktivitas FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- AKHIR SCRIPT
-- ============================================================
