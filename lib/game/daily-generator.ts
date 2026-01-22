import seedrandom from 'seedrandom';
import { getServiceSupabase } from '../supabase/client';

export class DailyGenerator {
  private supabase;

  constructor() {
    this.supabase = getServiceSupabase();
  }

  async generate(dateStr: string) {
    console.log(`Starting generation for ${dateStr}...`);
    
    // 1. Check if daily set already exists
    const { data: existing } = await this.supabase
      .from('daily_sets')
      .select('date')
      .eq('date', dateStr)
      .single();

    if (existing) {
      console.log(`Daily set for ${dateStr} already exists.`);
      return;
    }

    // 2. Generate seed from date
    const rng = seedrandom(dateStr);
    const seed = Math.abs(rng.int32());

    console.log(`Generating daily set for ${dateStr} with seed ${seed}`);

    // 3. Create Daily Set record
    const { error: createError } = await this.supabase
      .from('daily_sets')
      .insert({
        date: dateStr,
        seed: seed,
        snapshot_blob_url: null
      });

    if (createError) {
      console.error('Error creating daily set:', createError);
      throw createError;
    }

    // 4. Get active modes
    const { data: modes } = await this.supabase
      .from('modes')
      .select('id')
      .eq('active', true);

    if (!modes || modes.length === 0) {
      console.warn('No active modes found.');
      return;
    }

    for (const mode of modes) {
      // 5. Fetch candidate items for this mode
      const { data: items } = await this.supabase
        .from('items')
        .select('id, answer')
        .eq('mode_id', mode.id)
        .eq('status', 'active');

      if (!items || items.length < 5) {
        console.warn(`Not enough items for mode ${mode.id} (found ${items?.length || 0}). Skipping.`);
        continue;
      }

      // 6. Balanced Selection Logic
      const modeRng = seedrandom(`${dateStr}-${mode.id}`);
      const TARGET_PER_TYPE = 50;

      // Group items by answer (e.g., 'Real' vs 'Satire')
      const groups: Record<string, typeof items> = {};
      items.forEach(item => {
        const key = item.answer || 'unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      const keys = Object.keys(groups);
      const selected: typeof items = [];
      
      if (keys.length === 2) {
        // We have exactly two categories (e.g. Real/Satire). 
        // We want 50 of EACH, for a total of 100 items (if possible).
        const groupA = groups[keys[0]];
        const groupB = groups[keys[1]];

        // Shuffle each group independently
        const shuffledA = [...groupA].sort(() => 0.5 - modeRng());
        const shuffledB = [...groupB].sort(() => 0.5 - modeRng());

        // Take up to 50 from each
        selected.push(...shuffledA.slice(0, TARGET_PER_TYPE));
        selected.push(...shuffledB.slice(0, TARGET_PER_TYPE));

      } else {
        // Fallback: If we have >2 or 1 category, just pick 100 random items
        const shuffled = [...items].sort(() => 0.5 - modeRng());
        selected.push(...shuffled.slice(0, TARGET_PER_TYPE * 2));
      }

      // Final shuffle of the combined selection so they are mixed
      const finalSelection = selected.sort(() => 0.5 - modeRng());

      // 7. Insert into daily_set_items
      const setItems = finalSelection.map((item, index) => ({
        date: dateStr,
        mode_id: mode.id,
        item_id: item.id,
        position: index + 1
      }));

      const { error: itemsError } = await this.supabase
        .from('daily_set_items')
        .insert(setItems);

      if (itemsError) {
        console.error(`Error inserting items for mode ${mode.id}:`, itemsError);
      } else {
        console.log(`Generated ${selected.length} items for mode ${mode.id}`);
      }
    }
    
    console.log(`Daily set generation for ${dateStr} complete.`);
  }
}
