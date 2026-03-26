import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env from final_hack
const envPath = path.resolve('c:/Users/hp/Desktop/final_hack/.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_price,
          status,
          created_at,
          items,
          customer_id,
          profiles:customer_id (name, email)
        `)
        .limit(1);

  console.log("Error:", error);
  console.log("Data:", data);
}

testQuery();
