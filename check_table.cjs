const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '';
let key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('materials').select('*').limit(1);
  if (error) {
    console.error("Select Error:", error.message);
  } else {
    console.log("Data:", data);
  }
}
run();
