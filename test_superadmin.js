const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://crnxgaaudbsqguranglb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnhnYWF1ZGJzcWd1cmFuZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzYxNDIsImV4cCI6MjA4ODgxMjE0Mn0.0DDwhoAEt4su7fww-b--Cecdr4YP6dEZuc-OSIYBxZg');

async function test() {
  const { data: users, error: err1 } = await sb.from('profiles').select('id, role, onboarding_done, nama_pemilik').eq('role', 'superadmin');
  console.log('Superadmins:', users, err1);
}
test();
