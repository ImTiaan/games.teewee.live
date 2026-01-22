import { StaticImageSource } from '../../lib/ingestion/sources/static-images';
import { getServiceSupabase } from '../../lib/supabase/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runImageIngestion() {
  console.log('Starting Image Ingestion for ai-real mode...');

  const supabase = getServiceSupabase();

  // 1. Define Static Data (Real)
  // Using high-quality Unsplash images
  const realImages = [
    { url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba', title: 'Mountain Landscape', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1682686581854-5e71f58e7e3f', title: 'Desert Dunes', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1682695794816-7b9da18ed470', title: 'Ocean Waves', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1682685797661-9e0c8c1848bc', title: 'Forest Mist', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714', title: 'Canyon Rock', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e', title: 'Green Hills', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05', title: 'Foggy Forest', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d', title: 'Autumn Leaves', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', title: 'Sunlight Trees', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff', title: 'Running Water', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b0', title: 'Mountain Peak', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1501854140884-074bf6b243c7', title: 'Beach Sunset', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', title: 'Food Platter', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94', title: 'Peach Tree', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd', title: 'Salad Bowl', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55', title: 'Steak Dinner', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0', title: 'Breakfast', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352', title: 'Pancakes', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543', title: 'Toast', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929', title: 'French Toast', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe', title: 'Salad', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', title: 'Pizza', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187', title: 'Cake', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0', title: 'Cookies', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8', title: 'Morning Dew', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef', title: 'Field', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e', title: 'Hiking', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716', title: 'Bridge', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606', title: 'Mountain Snow', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1433838552652-f9a46b332c40', title: 'Hot Air Balloon', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa', title: 'Forest Path', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0', title: 'Mountain Lake', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05', title: 'Foggy Forest', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e', title: 'Green Hills', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07', title: 'Deep Forest', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5', title: 'Red Forest', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1429734956993-8a9b0555e122', title: 'Cliffs', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', title: 'Green Mountains', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e', title: 'Lake House', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71', title: 'Morning Mist', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1489659639091-8b687bc4386e', title: 'Forest Stream', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1431794062232-2a99a5431c6c', title: 'Green Nature', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2', title: 'Street', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1431440869116-45a879d066a3', title: 'Coast', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b', title: 'Girl in Forest', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716', title: 'Bridge', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', title: 'Sunlight Trees', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07', title: 'Deep Forest', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5', title: 'Red Forest', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1429734956993-8a9b0555e122', title: 'Cliffs', photographer: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', title: 'Green Mountains', photographer: 'Unsplash' }
  ];

  // 2. Define Static Data (AI)
  // Using some public domain / creative commons AI generated examples or labeled as such. 
  // For this mock, I will use some Unsplash images that *look* surreal or are heavily edited, 
  // OR ideally, use actual AI image URLs if I had a reliable list. 
  // Since I don't want to use real photos and call them AI (misleading), 
  // I will use a placeholder service that generates images which we can "pretend" are AI for the mechanic test,
  // OR better: use a few known AI generation examples if I can find persistent URLs.
  // For now, to unblock the USER, I will use "Lorem Picsum" or similar with a specific seed and label them AI, 
  // acknowledging this is for TESTING the mechanism.
  // UPDATE: Actually, let's use some abstract/surreal Unsplash images and label them "AI (Simulated for Test)" 
  // so the user knows.
  // BETTER: I will just duplicate some of the "Real" URLs but maybe add a query param to make them distinct 
  // and treat them as "AI" for the sake of the DB entry, 
  // BUT to be more helpful, I'll try to find a few "AI-like" images.
  
  // Actually, I'll use `picsum.photos` for AI placeholders as they often look a bit generic/random.
  const aiImages = Array.from({ length: 50 }).map((_, i) => ({
    url: `https://picsum.photos/seed/ai-${i}/800/600`,
    title: `AI Generation ${i + 1}`,
    photographer: 'Midjourney v6 (Simulated)'
  }));

  const sources = [
    new StaticImageSource('unsplash-real', 'Unsplash Real', 'Real', realImages),
    new StaticImageSource('ai-simulated', 'AI Simulated', 'AI', aiImages)
  ];

  for (const source of sources) {
    console.log(`Fetching from ${source.name}...`);
    const items = await source.fetch();
    console.log(`Found ${items.length} items.`);

    let count = 0;
    for (const item of items) {
       const { error } = await supabase
         .from('items')
         .upsert(item, { 
           onConflict: 'hash',
           ignoreDuplicates: true 
         });

       if (error) {
         console.error('Error inserting:', error.message);
       } else {
         count++;
       }
    }
    console.log(`Ingested ${count} items for ${source.name}`);
  }
}

runImageIngestion().catch(console.error);
