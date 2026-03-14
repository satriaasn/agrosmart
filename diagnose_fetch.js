
const URL = 'https://crnxgaaudbsqguranglb.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnhnYWF1ZGJzcWd1cmFuZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzYxNDIsImV4cCI6MjA4ODgxMjE0Mn0.0DDwhoAEt4su7fww-b--Cecdr4YP6dEZuc-OSIYBxZg';
const OWNER_ID = '779f71ef-f8e4-4ddd-9445-cb808e577a90';

async function diagnose() {
    const tables = ['profiles', 'lahan', 'tanaman', 'biaya', 'panen', 'team_members'];
    console.log(`Diagnosing Supabase for OWNER_ID: ${OWNER_ID}\n`);

    for (const table of tables) {
        try {
            // Check global count
            const globalRes = await fetch(`${URL}/${table}?select=count`, {
                headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Range': '0-0', 'Prefer': 'count=exact' }
            });
            const globalCount = globalRes.headers.get('content-range')?.split('/')[1] || 0;

            // Check specific owner count
            const filter = table === 'profiles' ? `id=eq.${OWNER_ID}` : `user_id=eq.${OWNER_ID}`;
            const ownerRes = await fetch(`${URL}/${table}?select=count&${filter}`, {
                headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Range': '0-0', 'Prefer': 'count=exact' }
            });
            const ownerCount = ownerRes.headers.get('content-range')?.split('/')[1] || 0;

            console.log(`Table [${table}]:`);
            console.log(`   Global Count: ${globalCount}`);
            console.log(`   Owner Count : ${ownerCount}`);

            if (parseInt(ownerCount) > 0) {
               const sampleRes = await fetch(`${URL}/${table}?${filter}&limit=1`, {
                   headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
               });
               const sample = await sampleRes.json();
               if (sample && sample[0]) {
                   console.log(`   Sample keys : ${Object.keys(sample[0]).join(', ')}`);
               }
            }
        } catch (e) {
            console.error(`Error diagnosing ${table}:`, e.message);
        }
        console.log('');
    }
}

diagnose();
