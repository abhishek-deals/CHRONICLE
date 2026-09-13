import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://esathoojvbtkwggpflsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYXRob29qdmJ0a3dnZ3BmbHNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTIwODk3MSwiZXhwIjoyMTA0Nzg0OTcxfQ.POvwmnqHG2ZdHJWD4GroJ20C_5SJvbKsN-judUbHbmk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ current_hp: 10, knockout_until: null })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // match all
  
  if (error) console.error(error);
  else console.log('HP updated successfully.');
}

main();
