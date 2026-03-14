
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://crnxgaaudbsqguranglb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnhnYWF1ZGJzcWd1cmFuZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzYxNDIsImV4cCI6MjA4ODgxMjE0Mn0.0DDwhoAEt4su7fww-b--Cecdr4YP6dEZuc-OSIYBxZg';

// We'll use a service role key if we can't get data with anon, but let's try anon first
// since the user is "owner" and should have access via RLS.
// Actually, to debug existence, service role is better. 
// BUT I don't have the service role key. I'll use anon and check if error is RLS or empty.

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OWNER_ID = '779f71ef-f8e4-4ddd-9445-cb808e577a90';

async function diagnose() {
    console.log(`Diagnosing for User ID: ${OWNER_ID}`);

    const tables = ['profiles', 'lahan', 'tanaman', 'biaya', 'panen', 'team_members'];

    for (const table of tables) {
        // We use .select('*', { count: 'exact', head: true }) to just get count
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .eq(table === 'profiles' ? 'id' : 'user_id', OWNER_ID);

        if (error) {
            console.error(`Error querying ${table}:`, error.message);
        } else {
            console.log(`Table ${table}: Found ${count} rows.`);
            
            if (count > 0) {
               // Show keys of first record
               const { data } = await supabase.from(table).select('*').eq(table === 'profiles' ? 'id' : 'user_id', OWNER_ID).limit(1);
               console.log(`   Sample keys: ${Object.keys(data[0]).join(', ')}`);
            }
        }
    }
    
    // Check if there are ANY records in these tables at all
    console.log('\n--- Checking Global Existence ---');
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) console.error(`Global error ${table}:`, error.message);
        else console.log(`Global Table ${table}: Total ${count} rows in DB.`);
    }
}

diagnose();
