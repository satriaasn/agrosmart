-- ============================================================
--  AgroSmart — Superadmin RLS Bypass Patch
--  Jalankan di Supabase SQL Editor
--  Memungkinkan superadmin melihat SEMUA data di Monitoring
-- ============================================================

-- ── 1. Superadmin bypass: panen ──────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_panen" ON public.panen;
CREATE POLICY "superadmin_bypass_panen" ON public.panen
  FOR ALL USING (public.is_superadmin());

-- ── 2. Superadmin bypass: lahan ──────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_lahan" ON public.lahan;
CREATE POLICY "superadmin_bypass_lahan" ON public.lahan
  FOR ALL USING (public.is_superadmin());

-- ── 3. Superadmin bypass: karyawan ───────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_karyawan" ON public.karyawan;
CREATE POLICY "superadmin_bypass_karyawan" ON public.karyawan
  FOR ALL USING (public.is_superadmin());

-- ── 4. Superadmin bypass: tanaman ────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_tanaman" ON public.tanaman;
CREATE POLICY "superadmin_bypass_tanaman" ON public.tanaman
  FOR ALL USING (public.is_superadmin());

-- ── 5. Superadmin bypass: aktivitas ──────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_aktivitas" ON public.aktivitas;
CREATE POLICY "superadmin_bypass_aktivitas" ON public.aktivitas
  FOR ALL USING (public.is_superadmin());

-- ── 6. Superadmin bypass: biaya ──────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_biaya" ON public.biaya;
CREATE POLICY "superadmin_bypass_biaya" ON public.biaya
  FOR ALL USING (public.is_superadmin());

-- ── 7. Function: Platform aggregate stats (SECURITY DEFINER) ─
-- Dipanggil dari loadMonitoring() agar superadmin bisa lihat semua data
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSONB;
BEGIN
  -- Hanya superadmin yang bisa akses
  IF NOT public.is_superadmin() THEN
    RETURN jsonb_build_object('error', 'Akses ditolak');
  END IF;

  SELECT jsonb_build_object(
    'total_panen_rp',   COALESCE((SELECT SUM(total) FROM public.panen), 0),
    'total_lahan_ha',   COALESCE((SELECT SUM(luas) FROM public.lahan), 0),
    'total_karyawan',   (SELECT COUNT(*) FROM public.karyawan),
    'total_tanaman',    (SELECT COUNT(*) FROM public.tanaman),
    'total_biaya_rp',   COALESCE((SELECT SUM(total) FROM public.biaya), 0),
    'monthly_signups',  (
      SELECT COUNT(*) FROM public.profiles
      WHERE created_at >= date_trunc('month', NOW())
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;

-- ── 8. Function: All aktivitas for superadmin ────────────────
CREATE OR REPLACE FUNCTION public.get_all_aktivitas(p_limit INT DEFAULT 100)
RETURNS TABLE (
  id          BIGINT,
  user_id     UUID,
  judul       TEXT,
  deskripsi   TEXT,
  created_at  TIMESTAMPTZ,
  nama_usaha  TEXT,
  email       TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Akses ditolak';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    a.judul,
    a.deskripsi,
    a.created_at,
    COALESCE(pr.nama_usaha, pr.nama_pemilik, '—') AS nama_usaha,
    COALESCE(pr.email, '—') AS email
  FROM public.aktivitas a
  LEFT JOIN public.profiles pr ON pr.id = a.user_id
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_aktivitas(INT) TO authenticated;

-- ── Verifikasi ───────────────────────────────────────────────
SELECT 'RLS bypass patch berhasil diterapkan!' AS status;
