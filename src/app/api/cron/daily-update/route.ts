import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '../../../../../lib/supabase/client';
import { ALL_FEEDS } from '../../../../../lib/ingestion/feeds';
import { DailyGenerator } from '../../../../../lib/game/daily-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout for Vercel Pro

export async function GET(req: NextRequest) {
  try {
    // 1. Authorization Check
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = getServiceSupabase();
    const logs: string[] = [];
    const log = (msg: string) => {
      console.log(msg);
      logs.push(msg);
    };

    log('Starting daily update cron job...');

    // 2. Ingestion
    log('--- Phase 1: Ingestion ---');
    let ingestedCount = 0;
    
    for (const source of ALL_FEEDS) {
      try {
        log(`Fetching ${source.name}...`);
        const items = await source.fetch();
        let sourceCount = 0;

        for (const item of items) {
          if (await source.validate(item)) {
            const { error } = await supabase
              .from('items')
              .upsert(item, { 
                onConflict: 'hash', 
                ignoreDuplicates: true 
              });
            
            if (!error) sourceCount++;
          }
        }
        ingestedCount += sourceCount;
        log(`Processed ~${sourceCount} items from ${source.name} (new & existing)`);
      } catch (err) {
        log(`Error processing ${source.name}: ${err}`);
      }
    }
    log(`Total items processed: ${ingestedCount}`);

    // 3. Reset Daily Sets
    const today = new Date().toISOString().split('T')[0];
    log(`--- Phase 2: Resetting for ${today} ---`);

    const { error: deleteItemsError } = await supabase
      .from('daily_set_items')
      .delete()
      .eq('date', today);
    
    if (deleteItemsError) throw new Error(`Failed to delete items: ${deleteItemsError.message}`);

    const { error: deleteSetsError } = await supabase
      .from('daily_sets')
      .delete()
      .eq('date', today);

    if (deleteSetsError) throw new Error(`Failed to delete sets: ${deleteSetsError.message}`);
    log('Reset complete.');

    // 4. Generate New Sets
    log(`--- Phase 3: Generating Sets for ${today} ---`);
    const generator = new DailyGenerator();
    await generator.generate(today);
    log('Generation complete.');

    return NextResponse.json({ 
      success: true, 
      date: today,
      ingested: ingestedCount,
      logs 
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
