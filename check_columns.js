
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://crnxgaaudbsqguranglb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnhnYWF1ZGJzcWd1cmFuZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzYxNDIsImV4cCI6MjA4ODgxMjE0Mn0.0DDwhoAEt4su7fww-b--Cecdr4YP6dEZuc-OSIYBxZg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log('--- Checking TABLE: tanaman ---');
    const { data: tData, error: tErr } = await supabase.from('tanaman').select('*').limit(1);
    if (tErr) console.error('Error fetching tanaman:', tErr);
    else console.log('Tanaman columns:', Object.keys(tData[0] || {}));

    console.log('--- Checking TABLE: lahan ---');
    const { data: lData, error: lErr } = await supabase.from('lahan').select('*').limit(1);
    if (lErr) console.error('Error fetching lahan:', lErr);
    else console.log('Lahan columns:', Object.keys(lData[0] || {}));

    console.log('--- Checking TABLE: biaya ---');
    const { data: bData, error: bErr } = await supabase.from('biaya').select('*').limit(1);
    if (bErr) console.error('Error fetching biaya:', bErr);
    else console.log('Biaya columns:', Object.keys(bData[0] || {}));

    console.log('--- Checking TABLE: panen ---');
    const { data: pData, error: pErr } = await supabase.from('panen').select('*').limit(1);
    if (pErr) console.error('Error fetching panen:', pErr);
    else console.log('Panen columns:', Object.keys(pData[0] || {}));
}

checkSchema();
