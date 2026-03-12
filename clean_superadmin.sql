-- ============================================================
-- PEMBERSIHAN DATA USER SUPERADMIN YANG ERROR
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- Menghapus user superadmin yang dibuat manual via SQL sebelumnya
DELETE FROM auth.users WHERE email = 'superadmin@agrosmart.com';
DELETE FROM public.profiles WHERE nama_pemilik = 'Super Administrator' AND nama_usaha = 'Pusat AgroSmart';

SELECT 'Berhasil dibersihkan. Silakan daftar via UI aplikasi sekarang!' as status;
