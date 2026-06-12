// test_expenses.cjs
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xmyaqbyiusopmrzzczzx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteWFxYnlpdXNvcG1yenpjenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDkwNzUsImV4cCI6MjA5NjQyNTA3NX0.sJtAm-EKDw0MdcuVDOUDYDW6qPQzdxYAo_HA1FzJhsk');

async function run() {
  const { data: users } = await supabase.from('profiles').select('id, full_name');
  if (!users) return console.log('no users');
  const ana = users.find(u => u.full_name.includes('Ana'));
  
  if (!ana) return console.log('Ana not found');

  const userId = ana.id;
  const monthStart = '2026-05-01';
  const monthEnd = '2026-06-30';
  
  let expenseQuery = supabase
      .from('financial_transactions')
      .select('amount, split_amount, shared_with_id, created_by')
      .eq('type', 'expense')
      .eq('status', 'paid')

  const condition = `shared_with_id.eq.${userId},and(shared_with_id.is.null,created_by.eq.${userId})`
  expenseQuery = expenseQuery.or(condition)

  const { data } = await expenseQuery;
  console.log("Raw Data:", data);

  const total = (data || []).reduce((sum, t) => sum + Number(userId && t.split_amount !== null ? t.split_amount : t.amount), 0);
  console.log("Total for Ana:", total);
}
run();
