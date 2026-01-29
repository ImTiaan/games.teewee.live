
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '../../../../../lib/supabase/client';
import { ALL_FEEDS } from '../../../../../lib/ingestion/feeds';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

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

    log('Starting daily ingestion cron job...');

    // 2. Ingestion
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

    return NextResponse.json({ 
      success: true, 
      type: 'ingest',
      ingested: ingestedCount,
      logs 
    });

  } catch (error) {
    console.error('Ingestion cron job failed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
