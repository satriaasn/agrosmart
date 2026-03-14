
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://crnxgaaudbsqguranglb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnhnYWF1ZGJzcWd1cmFuZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzYxNDIsImV4cCI6MjA4ODgxMjE0Mn0.0DDwhoAEt4su7fww-b--Cecdr4YP6dEZuc-OSIYBxZg';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnose() {
  const { data: profiles } = await sb.from('profiles').select('id, email').limit(5);
  console.log('--- Profiles ---');
  console.table(profiles);

  if (profiles && profiles.length > 0) {
    const uid = profiles[0].id; // Test with first user
    console.log(`\n--- Diagnosing for UID: ${uid} ---`);
    
    const { data: kats } = await sb.from('expense_categories').select('*').eq('user_id', uid);
    console.log('\n--- Expense Categories ---');
    console.table(kats);

    const { data: coas } = await sb.from('chart_of_accounts').select('*').eq('user_id', uid).eq('account_type', 'Expense');
    console.log('\n--- Expense COA ---');
    console.table(coas);
  }
}

diagnose();
