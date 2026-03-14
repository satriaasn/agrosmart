const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://crnxgaaudbsqguranglb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnhnYWF1ZGJzcWd1cmFuZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzYxNDIsImV4cCI6MjA4ODgxMjE0Mn0.0DDwhoAEt4su7fww-b--Cecdr4YP6dEZuc-OSIYBxZg';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkOwners() {
  const { data, error } = await sb
    .from('profiles')
    .select('id, nama_pemilik, role, email')
    .eq('role', 'owner')
    .limit(5);

  if (error) {
    console.error('Error fetching owners:', error);
    return;
  }

  console.log('Recent Owners:', data);
}

checkOwners();
