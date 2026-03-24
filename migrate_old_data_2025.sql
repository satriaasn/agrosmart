-- ==============================================================================
-- AgroSmart — Migrasi Data Lama ke Musim Tanam 2025
-- Script ini akan:
-- 1. Membuatkan periode "Periode Awal 2025" untuk setiap owner jika belum ada
-- 2. Menghubungkan semua data (lahan, tanaman, panen, biaya, aktivitas) 
--    yang belum memiliki season_id ke periode tersebut agar terkontrol.
-- ==============================================================================

DO $$ 
DECLARE
    r RECORD;
    new_season_id BIGINT;
    v_nama TEXT := 'Periode Awal 2025';
    v_tgl_mulai DATE := '2025-01-01';
BEGIN
    -- Lakukan perulangan untuk semua user yang ada di auth.users
    FOR r IN SELECT DISTINCT id FROM auth.users LOOP
        
        -- Cek apakah user adalah owner atau superadmin di tabel profiles
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = r.id AND role IN ('owner', 'superadmin')) THEN
            
            -- Cek apakah season "Periode Awal 2025" sudah ada untuk user ini
            SELECT id INTO new_season_id FROM public.planting_seasons WHERE user_id = r.id AND nama = v_nama LIMIT 1;
            
            -- Jika belum ada periode tersebut, buatkan baru untuk user ini
            IF new_season_id IS NULL THEN
                INSERT INTO public.planting_seasons (user_id, nama, tanggal_mulai, status)
                VALUES (r.id, v_nama, v_tgl_mulai, 'aktif')
                RETURNING id INTO new_season_id;
            END IF;

            -- Update semua data lama milik user (yang season_id-nya masih NULL) agar diikat ke periode 2025
            UPDATE public.tanaman SET season_id = new_season_id WHERE user_id = r.id AND season_id IS NULL;
            UPDATE public.lahan SET season_id = new_season_id WHERE user_id = r.id AND season_id IS NULL;
            UPDATE public.panen SET season_id = new_season_id WHERE user_id = r.id AND season_id IS NULL;
            UPDATE public.biaya SET season_id = new_season_id WHERE user_id = r.id AND season_id IS NULL;
            
            -- Update aktivitas lama (kolom season_id di aktivitas ditambahkan oleh patch sebelumnya)
            UPDATE public.aktivitas SET season_id = new_season_id WHERE user_id = r.id AND season_id IS NULL;
            
        END IF;
    END LOOP;
END $$;
