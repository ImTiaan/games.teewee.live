import { getServiceSupabase } from '../../../../lib/supabase/client';
import GameOrchestrator from './GameOrchestrator';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function PlayPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode: modeId } = await params;
  const hiddenModeIds = new Set([
    'guess-the-city',
    'guess-city',
    'guess-the-landmark',
    'ai-real',
    'human-machine'
  ]);
  if (hiddenModeIds.has(modeId)) {
    notFound();
  }
  const supabase = getServiceSupabase();

  // 1. Fetch Mode
  const { data: mode } = await supabase
    .from('modes')
    .select('*')
    .eq('id', modeId)
    .single();

  if (!mode) {
    notFound();
  }

  // 2. Fetch Daily Set for Today
  const today = new Date().toISOString().split('T')[0];
  
  const { data: dailySetItems } = await supabase
    .from('daily_set_items')
    .select(`
      position,
      items (
        id,
        prompt_text,
        answer,
        source_name,
        source_url,
        asset_type,
        metadata,
        choices_json
      )
    `)
    .eq('date', today)
    .eq('mode_id', modeId)
    .order('position');

  // Handle no items gracefully - allow orchestrator to show "0 items" state or handle it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (dailySetItems || []).map((dsi: any) => ({
    id: dsi.items.id,
    prompt_text: dsi.items.prompt_text,
    answer: dsi.items.answer,
    source_name: dsi.items.source_name,
    source_url: dsi.items.source_url,
    asset_type: dsi.items.asset_type,
    metadata: dsi.items.metadata,
    choices: dsi.items.choices_json // Map JSON column
  }));
  
  const rules = mode.rules_json as { choices?: string[] };
  const choices = rules?.choices || ['True', 'False'];

  return (
    <GameOrchestrator 
      modeId={mode.id}
      modeTitle={mode.title}
      dailyItems={items}
      choices={choices}
      isHeadline={mode.is_headline ?? false}
    />
  );
}
