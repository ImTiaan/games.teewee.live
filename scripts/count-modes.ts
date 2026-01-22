
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const modes = [
  'ai-real',
  'animal-fictional',
  'headline-satire',
  'human-machine',
  'job-fake'
];

async function countItems() {
  console.log('Counting items per mode (accurate)...');
  
  const counts: Record<string, number> = {};

  for (const mode of modes) {
    const { count, error } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('mode_id', mode);

    if (error) {
      console.error(`Error counting ${mode}:`, error);
    } else {
      counts[mode] = count || 0;
    }
  }

  console.log('\nItem Counts by Mode:');
  console.table(Object.entries(counts).map(([mode, count]) => ({ Mode: mode, Count: count })));
}

countItems();
