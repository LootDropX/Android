
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('Checking Supabase connection...');
  console.log('URL:', SUPABASE_URL);
  
  // Try to query a common table or just getting the schema info
  const { data, error } = await supabase.from('drops').select('id').limit(1);
  
  if (error) {
    console.error('Error querying "drops" table:', error.message);
  } else {
    console.log('"drops" table exists! Data:', data);
  }
}

main().catch(console.error);
