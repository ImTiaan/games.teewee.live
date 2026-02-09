'use server';

import { getServiceSupabase } from '../../../lib/supabase/client';
import { createClient } from '../../../lib/supabase/server';

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
        metadata,
        choices_json
      `)
      .in('id', selectedIds);

    if (itemsError) {
      console.error('Error fetching item details:', itemsError);
      throw new Error('Failed to fetch item details');
    }

    // 4. Shuffle the result items one more time (since .in() might return in ID order)
    // And map choices_json to choices
    const finalItems = items?.map(item => ({
      ...item,
      choices: item.choices_json // Map JSON column to choices prop
    })).sort(() => Math.random() - 0.5) || [];

    return finalItems;

  } catch (error) {
    console.error('Archive fetch error:', error);
    return [];
  }
}

export async function submitPlay(
  modeId: string, 
  itemId: string, 
  answerGiven: string, 
  isCorrect: boolean, 
  timeMs: number
) {
  // 1. Get User from Cookies (Secure)
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  // 2. Write to DB using Service Role (Privileged)
  const supabaseService = getServiceSupabase();

  try {
    const { error } = await supabaseService.from('plays').insert({
      mode_id: modeId,
      item_id: itemId,
      user_id: user?.id || null, // Will be user ID if logged in, null otherwise
      answer_given: answerGiven,
      is_correct: isCorrect,
      time_ms: timeMs,
    });

    if (error) {
      console.error('Error submitting play:', error);
    }
  } catch (e) {
    console.error('Exception submitting play:', e);
  }
}
