-- ============================================================
-- AgroSmart — SQL PATCH: Admin & Harvest Improvements (RE-RUN)
-- ============================================================

-- 1. Tambah kolom email ke PROFILES agar Admin Panel bisa menampilkan email user
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. Update trigger handle_new_user() untuk menyinkronkan email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama_pemilik, role, onboarding_done)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- 3. Migrasi data email yang sudah ada
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 4. Tambah kolom multiplier & harga_raw ke PANEN
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='panen' AND column_name='multiplier_label') THEN
        ALTER TABLE public.panen ADD COLUMN multiplier_label TEXT DEFAULT 'per_kg';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='panen' AND column_name='harga_raw') THEN
        ALTER TABLE public.panen ADD COLUMN harga_raw NUMERIC;
    END IF;
END $$;

-- SELESAI.
