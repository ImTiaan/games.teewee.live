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
      // 5. Fetch used items from last 7 days
      const lastWeek = new Date(new Date(dateStr).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: recentItems } = await this.supabase
        .from('daily_set_items')
        .select('item_id')
        .eq('mode_id', mode.id)
        .gte('date', lastWeek)
        .lt('date', dateStr); // Exclude today if re-running
      
      const usedItemIds = new Set(recentItems?.map(i => i.item_id) || []);

      // 6. Fetch candidate items for this mode
      // Added metadata and created_at for freshness sorting
      const { data: items } = await this.supabase
        .from('items')
        .select('id, answer, metadata, created_at')
        .eq('mode_id', mode.id)
        .eq('status', 'active');

      if (!items || items.length < 5) {
        console.warn(`Not enough items for mode ${mode.id} (found ${items?.length || 0}). Skipping.`);
        continue;
      }

      // Filter out recently used items (unless we run out of items)
      let candidateItems = items.filter(item => !usedItemIds.has(item.id));
      if (candidateItems.length < 20) {
        console.warn(`Low fresh items for mode ${mode.id} (${candidateItems.length}). Using all active items.`);
        candidateItems = items;
      }

      // 7. Balanced Selection Logic (Prioritize Freshness)
      const modeRng = seedrandom(`${dateStr}-${mode.id}`);
      const TARGET_PER_TYPE = 50;

      // Group items by answer
      const groups: Record<string, typeof items> = {};
      candidateItems.forEach(item => {
        const key = item.answer || 'unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      // Sort each group by date descending (Newest first)
      // Use pubDate from metadata if available, else created_at
      const getItemDate = (item: any) => {
        const pubDate = item.metadata?.pubDate;
        if (pubDate) return new Date(pubDate).getTime();
        return new Date(item.created_at).getTime();
      };

      Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => getItemDate(b) - getItemDate(a));
      });

      const keys = Object.keys(groups);
      const selected: typeof items = [];
      
      if (keys.length === 2) {
        const groupA = groups[keys[0]];
        const groupB = groups[keys[1]];

        // Take top N newest items from each group
        // If we have enough "fresh" items, this ensures we play the news
        selected.push(...groupA.slice(0, TARGET_PER_TYPE));
        selected.push(...groupB.slice(0, TARGET_PER_TYPE));

      } else {
        // Fallback: sort all by date and take top 100
        const sortedAll = [...candidateItems].sort((a, b) => getItemDate(b) - getItemDate(a));
        selected.push(...sortedAll.slice(0, TARGET_PER_TYPE * 2));
      }

      // Final shuffle of the combined selection so they are mixed in the game
      const finalSelection = selected.sort(() => 0.5 - modeRng());

      // 8. Insert into daily_set_items
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
