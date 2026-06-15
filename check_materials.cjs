const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// get url and key from .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '';
let key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('materials').select('*');
  if (error) {
    console.error(error);
    return;
  }
  console.log('Materials count:', data.length);
  const names = data.map(m => m.name);
  const duplicates = names.filter((item, index) => names.indexOf(item) !== index);
  console.log('Duplicates:', duplicates);
}
run();
