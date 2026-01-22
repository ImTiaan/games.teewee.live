
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkItems() {
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .eq('mode_id', 'ai-real')
    .limit(5);

  if (error) {
    console.error('Error fetching items:', error);
    return;
  }

  console.log('Sample items:', JSON.stringify(items, null, 2));
}

checkItems();
