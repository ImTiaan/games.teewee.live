'use server';

import { getServiceSupabase } from '../../../lib/supabase/client';

export async function fetchArchiveItems(modeId: string, count: number) {
  const supabase = getServiceSupabase();

  try {
    // 1. Fetch all active item IDs for the mode
    // We only select 'id' to keep the query light
    const { data: allIds, error: idError } = await supabase
      .from('items')
      .select('id')
      .eq('mode_id', modeId)
      .eq('status', 'active');

    if (idError) {
      console.error('Error fetching item IDs:', idError);
      throw new Error('Failed to fetch items');
    }

    if (!allIds || allIds.length === 0) {
      return [];
    }

    // 2. Shuffle IDs and slice the requested count
    // Fisher-Yates shuffle
    const shuffledIds = [...allIds];
    for (let i = shuffledIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
    }

    // If count is very large (e.g. Marathon), we'll fetch everything available
    const selectedIds = shuffledIds.slice(0, count).map(item => item.id);

    // 3. Fetch full item details for the selected IDs
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(`
        id,
        prompt_text,
        answer,
        source_name,
        source_url,
        asset_type,
        metadata
      `)
      .in('id', selectedIds);

    if (itemsError) {
      console.error('Error fetching item details:', itemsError);
      throw new Error('Failed to fetch item details');
    }

    // 4. Shuffle the result items one more time (since .in() might return in ID order)
    const finalItems = items?.sort(() => Math.random() - 0.5) || [];

    return finalItems;

  } catch (error) {
    console.error('Archive fetch error:', error);
    return [];
  }
}
