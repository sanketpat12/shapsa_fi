import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: orders, error: oErr } = await supabase.from('orders').select('*');
  console.log('Orders:', orders?.length, oErr?.message || 'OK');
  if (orders?.length > 0) {
    console.log('Sample Order:', orders[0]);
  }

  const { data: prods, error: pErr } = await supabase.from('products').select('*');
  console.log('Products:', prods?.length, pErr?.message || 'OK');
  if (prods?.length > 0) {
    console.log('Sample Product:', prods[0]);
  }
}

check();
