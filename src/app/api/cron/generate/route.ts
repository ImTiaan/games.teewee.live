
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '../../../../../lib/supabase/client';
import { DailyGenerator } from '../../../../../lib/game/daily-generator';

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

    const today = new Date().toISOString().split('T')[0];
    log(`Starting daily generation cron job for ${today}...`);

    // 2. Reset Daily Sets
    log(`--- Phase 1: Resetting for ${today} ---`);

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

    // 3. Generate New Sets
    log(`--- Phase 2: Generating Sets for ${today} ---`);
    const generator = new DailyGenerator();
    await generator.generate(today);
    log('Generation complete.');

    return NextResponse.json({ 
      success: true, 
      type: 'generate',
      date: today,
      logs 
    });

  } catch (error) {
    console.error('Generation cron job failed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
