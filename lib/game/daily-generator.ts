import seedrandom from 'seedrandom';
import { getServiceSupabase } from '../supabase/client';

export class DailyGenerator {
  private supabase;

  constructor() {
    this.supabase = getServiceSupabase();
  }

  async generate(dateStr: string) {
    console.log(`Starting generation for ${dateStr}...`);
    
    // 1. Ensure Daily Set record exists
    let { data: existing } = await this.supabase
      .from('daily_sets')
      .select('date')
      .eq('date', dateStr)
      .single();

    if (!existing) {
      // Generate seed from date
      const rng = seedrandom(dateStr);
      const seed = Math.abs(rng.int32());

      console.log(`Creating daily set for ${dateStr} with seed ${seed}`);

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
    } else {
      console.log(`Daily set for ${dateStr} already exists. Checking for missing modes...`);
    }

    // 2. Get active modes
    const { data: modes } = await this.supabase
      .from('modes')
      .select('id')
      .eq('active', true);

    if (!modes || modes.length === 0) {
      console.warn('No active modes found.');
      return;
    }

    for (const mode of modes) {
      // 3. Check if items already exist for this mode
      const { count } = await this.supabase
        .from('daily_set_items')
        .select('*', { count: 'exact', head: true })
        .eq('date', dateStr)
        .eq('mode_id', mode.id);

      if (count && count > 0) {
        console.log(`Items for mode ${mode.id} already exist. Skipping.`);
        continue;
      }

      console.log(`Generating items for mode ${mode.id}...`);

      // 4. Fetch used items from last 7 days
      const lastWeek = new Date(new Date(dateStr).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: recentItems } = await this.supabase
        .from('daily_set_items')
        .select('item_id')
        .eq('mode_id', mode.id)
        .gte('date', lastWeek)
        .lt('date', dateStr); // Exclude today if re-running
      
      const usedItemIds = new Set(recentItems?.map(i => i.item_id) || []);

      // 5. Fetch candidate items for this mode
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

      // 6. Selection Logic (Prioritize Freshness & Balance)
      const modeRng = seedrandom(`${dateStr}-${mode.id}`);
      
      // Sort candidates by freshness (metadata.pubDate or created_at)
      // We add a small random factor to same-dated items to vary selection slightly if many have same date
      candidateItems.sort((a, b) => {
        const dateA = new Date(a.metadata?.pubDate || a.created_at).getTime();
        const dateB = new Date(b.metadata?.pubDate || b.created_at).getTime();
        if (dateA !== dateB) return dateB - dateA; // Descending (newest first)
        return 0.5 - modeRng();
      });

      // Take top N newest items to form the pool, then shuffle or balance them
      // Actually, for daily sets we usually want a specific set size (e.g. 10)
      // If we just take top 10 newest, it might be unbalanced (e.g. all "Real").
      // So we should take a larger pool of "fresh" items and then balance-select from them.
      
      const FRESH_POOL_SIZE = 50; // Consider top 50 newest items
      const pool = candidateItems.slice(0, FRESH_POOL_SIZE);

      const TARGET_COUNT = 10;
      let selectedItems: typeof items = [];

      // Group by answer for balancing
      const groups: Record<string, typeof items> = {};
      pool.forEach(item => {
        const key = item.answer || 'unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      
      const keys = Object.keys(groups);
      
      if (keys.length > 0) {
        // Round-robin selection from groups to ensure balance
        let attempts = 0;
        while (selectedItems.length < TARGET_COUNT && attempts < TARGET_COUNT * 2) {
            for (const key of keys) {
                if (selectedItems.length >= TARGET_COUNT) break;
                
                // Pick a random item from this group
                const groupItems = groups[key];
                if (groupItems.length > 0) {
                    const idx = Math.floor(modeRng() * groupItems.length);
                    selectedItems.push(groupItems[idx]);
                    groupItems.splice(idx, 1); // Remove selected
                }
            }
            attempts++;
        }
      } else {
          // Fallback if no grouping (shouldn't happen)
          selectedItems = pool.slice(0, TARGET_COUNT);
      }
      
      // Shuffle the final selection so the order isn't predictable (e.g. Real, Fake, Real, Fake)
      selectedItems.sort(() => 0.5 - modeRng());

      // 7. Insert daily set items
      const { error: insertError } = await this.supabase
        .from('daily_set_items')
        .insert(
          selectedItems.map((item, i) => ({
            date: dateStr,
            mode_id: mode.id,
            item_id: item.id,
            position: i
          }))
        );

      if (insertError) {
        console.error(`Error inserting items for mode ${mode.id}:`, insertError);
      } else {
        console.log(`Generated ${selectedItems.length} items for mode ${mode.id}`);
      }
    }
  }
}
