import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getServiceSupabase } from '../lib/supabase/client';

async function run() {
  const args = process.argv.slice(2);
  let dateStr = args[0];

  if (!dateStr) {
    const today = new Date();
    dateStr = today.toISOString().split('T')[0];
  }

  console.log(`Resetting daily set for ${dateStr}...`);
  const supabase = getServiceSupabase();

  // Delete daily_set_items first (FK constraint)
  const { error: itemsError } = await supabase
    .from('daily_set_items')
    .delete()
    .eq('date', dateStr);

  if (itemsError) console.error('Error deleting items:', itemsError);
  else console.log('Deleted daily_set_items');

  // Delete daily_sets
  const { error: setError } = await supabase
    .from('daily_sets')
    .delete()
    .eq('date', dateStr);

  if (setError) console.error('Error deleting set:', setError);
  else console.log('Deleted daily_sets');
}

run();
