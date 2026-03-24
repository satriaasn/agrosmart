-- Jalankan ini di SQL Editor Supabase Anda untuk memaksa email satriadestrian@gmail.com menjadi superadmin hari ini juga.
UPDATE public.profiles
SET role = 'superadmin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'satriadestrian@gmail.com'
);
