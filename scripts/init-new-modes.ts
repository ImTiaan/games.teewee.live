import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const newModes = [
  {
    id: 'guess-the-city',
    title: 'Guess the City',
    description: 'Can you identify the city from a single photo?',
    round_type: 'multi',
    rules_json: { type: 'multi-choice' }, 
    active: true
  },
  {
    id: 'guess-the-landmark',
    title: 'Guess the Landmark',
    description: 'Identify these world-famous sites.',
    round_type: 'multi',
    rules_json: { type: 'multi-choice' },
    active: true
  },
  {
    id: 'guess-the-era',
    title: 'Guess the Era',
    description: 'When was this painted?',
    round_type: 'multi',
    rules_json: { type: 'multi-choice' },
    active: true
  },
  {
    id: 'guess-the-country',
    title: 'Guess the Country',
    description: 'Where does this dish come from?',
    round_type: 'multi',
    rules_json: { type: 'multi-choice' },
    active: true
  }
];

async function main() {
  console.log('Initializing new modes...');
  
  for (const mode of newModes) {
    const { error } = await supabase
      .from('modes')
      .upsert(mode, { onConflict: 'id' });
      
    if (error) {
      console.error(`Error upserting ${mode.id}:`, error);
    } else {
      console.log(`Upserted ${mode.id}`);
    }
  }
  
  console.log('Done.');
}

main().catch(console.error);
