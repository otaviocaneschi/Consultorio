import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').map(line => {
  const parts = line.split('=');
  return [parts[0], parts.slice(1).join('=')];
}));

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { data: txs, error: err2 } = await supabase.from('financial_transactions').select('*');
  console.log('Transactions:', txs || err2);
  
  const { data: apts, error: err3 } = await supabase.from('appointments').select('*').limit(5);
  console.log('Appointments:', apts || err3);
}

check();
