import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { RSSSource } from '../lib/ingestion/sources/rss';
import { getServiceSupabase } from '../lib/supabase/client';
import { IngestionSource } from '../lib/ingestion/types';

async function runIngestion() {
  console.log('Starting ingestion...');

  try {
    const supabase = getServiceSupabase();

    // Define sources
    const sources: IngestionSource[] = [
      new RSSSource(
        'bbc-world',
        'BBC World News',
        'http://feeds.bbci.co.uk/news/world/rss.xml',
        'Real'
      ),
      new RSSSource(
        'the-onion',
        'The Onion',
        'https://www.theonion.com/rss',
        'Satire'
      )
    ];

    for (const source of sources) {
      console.log(`Fetching from ${source.name}...`);
      const items = await source.fetch();
      console.log(`Fetched ${items.length} items from ${source.name}`);

      let insertedCount = 0;
      let errorCount = 0;

      for (const item of items) {
        // Validate
        const isValid = await source.validate(item);
        if (!isValid) {
          console.log(`Skipping invalid item: ${item.prompt_text}`);
          continue;
        }

        // Insert into Supabase
        const { error } = await supabase
          .from('items')
          .upsert(item, { 
            onConflict: 'hash',
            ignoreDuplicates: true 
          });

        if (error) {
          console.error(`Error inserting item ${item.prompt_text}:`, error);
          errorCount++;
        } else {
          insertedCount++;
        }
      }

      console.log(`Source ${source.name}: Inserted ${insertedCount}, Errors ${errorCount}`);
    }

    console.log('Ingestion complete.');
  } catch (error) {
    console.error('Ingestion failed:', error);
    process.exit(1);
  }
}

runIngestion();
