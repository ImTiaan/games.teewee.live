import { RSSSource } from '../../lib/ingestion/sources/rss';
import { getServiceSupabase } from '../../lib/supabase/client';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function runIngestion() {
  console.log('Starting ingestion...');

  const sources = [
    // Real News (Examples)
    new RSSSource('bbc-news', 'BBC News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'Real'),
    new RSSSource('nyt-world', 'NYT World', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', 'Real'),
    
    // Satire
    new RSSSource('onion', 'The Onion', 'https://www.theonion.com/rss', 'Satire'),
    new RSSSource('beaverton', 'The Beaverton', 'https://www.thebeaverton.com/feed/', 'Satire'),
    new RSSSource('daily-mash', 'The Daily Mash', 'https://www.thedailymash.co.uk/feed', 'Satire'),
    new RSSSource('babylon-bee', 'The Babylon Bee', 'https://babylonbee.com/feed', 'Satire'),
    new RSSSource('new-yorker-borowitz', 'The Borowitz Report', 'https://www.newyorker.com/feed/humor/borowitz-report', 'Satire'),
    new RSSSource('reductress', 'Reductress', 'https://reductress.com/rss', 'Satire'),
    new RSSSource('duffel-blog', 'Duffel Blog', 'https://www.duffelblog.com/feed', 'Satire'),
    new RSSSource('betoota', 'The Betoota Advocate', 'https://www.betootaadvocate.com/feed/', 'Satire'),
    new RSSSource('chaser', 'The Chaser', 'https://chaser.com.au/feed/', 'Satire'),
    new RSSSource('waterford-whispers', 'Waterford Whispers News', 'https://waterfordwhispersnews.com/feed/', 'Satire')
  ];

  const supabase = getServiceSupabase();

  for (const source of sources) {
    console.log(`Fetching from ${source.name}...`);
    const items = await source.fetch();
    console.log(`Found ${items.length} items.`);

    let ingestedCount = 0;

    for (const item of items) {
      if (await source.validate(item)) {
        const { error: insertError } = await supabase
             .from('items')
             .upsert(item, { 
               onConflict: 'hash', 
               ignoreDuplicates: true 
             });

        if (insertError) {
          console.error(`Error inserting item: ${insertError.message}`);
        } else {
          // We can't easily distinguish between inserted and ignored with .ignore(), 
          // but assuming no error means it was handled.
          // To be precise, we'd need to select first or use upsert with a condition,
          // but strictly, we just want to ingest new stuff.
          ingestedCount++;
        }
      }
    }
    console.log(`Finished ${source.name}: ~${ingestedCount} processed (duplicates skipped silently).`);
  }
  
  console.log('Ingestion complete.');
}

runIngestion().catch(console.error);
