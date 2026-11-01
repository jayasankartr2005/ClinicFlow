const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wqhqpcbbzhtqbriglwlt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaHFwY2Jiemh0cWJyaWdsd2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzI3NzEsImV4cCI6MjEwNTE0ODc3MX0.lgjS3jtSt8W8ltlEcuMx-MNcHoXtcp1vsr3Ms26jyzQ';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: hospitals, error } = await client.from('hospitals').select('*');
  console.log('Hospitals in DB:', hospitals, 'Error:', error);
}

main();
