
'use server';

import { getServiceSupabase } from '../../../lib/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string;
  total_plays: number;
  correct_plays: number;
  win_rate: number;
  rank?: number;
}

export async function fetchLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('view_leaderboard')
    .select('*')
    .order('win_rate', { ascending: false })
    .order('total_plays', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  // Add rank locally
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((entry: any, index: number) => ({
    user_id: entry.user_id,
    username: entry.username,
    avatar_url: entry.avatar_url,
    total_plays: entry.total_plays,
    correct_plays: entry.correct_plays,
    win_rate: entry.win_rate,
    rank: index + 1
  }));
}
