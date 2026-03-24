const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL      = 'https://crnxgaaudbsqguranglb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnhnYWF1ZGJzcWd1cmFuZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzYxNDIsImV4cCI6MjA4ODgxMjE0Mn0.0DDwhoAEt4su7fww-b--Cecdr4YP6dEZuc-OSIYBxZg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'satriadestrian@gmail.com',
    password: 'satriadestrian@gmail.com'
  });

  if (loginError) {
    const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({
      email: 'satriadestrian@gmail.com',
      password: 'password'
    });
    if (e2) {
      const { data: d3, error: e3 } = await supabase.auth.signInWithPassword({
        email: 'satriadestrian@gmail.com',
        password: 'satriadestrian'
      });
      if (e3) {
         console.log("Login failed altogether:", e3.message);
         return;
      }
    }
  }

  console.log("Logged in!");
  
  const { data: stats, error: statErr } = await supabase.rpc('get_platform_stats');
  console.log("RPC stats:", JSON.stringify(stats, null, 2), statErr);

  const { data: acts, error: actErr } = await supabase.rpc('get_all_aktivitas', { p_limit: 10 });
  console.log("RPC aktivitas:", acts?.length || acts, actErr);
}

test();
