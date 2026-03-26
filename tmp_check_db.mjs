import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Sample profiles:', data);
  }

  const { data: orders, error: orderError } = await supabase.from('orders').select('customer_id').limit(5);
  if (orderError) {
    console.error('Error fetching orders:', orderError);
  } else {
    console.log('Sample order customer IDs:', orders.map(o => o.customer_id));
  }
}

checkProfiles();
