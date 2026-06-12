const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xmyaqbyiusopmrzzczzx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteWFxYnlpdXNvcG1yenpjenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDkwNzUsImV4cCI6MjA5NjQyNTA3NX0.sJtAm-EKDw0MdcuVDOUDYDW6qPQzdxYAo_HA1FzJhsk');
async function run() {
  const { data } = await supabase.from('profiles').select('full_name, role:roles(name)');
  console.log(JSON.stringify(data, null, 2));
}
run();
