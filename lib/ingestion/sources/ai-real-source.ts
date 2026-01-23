
import { IngestionSource, IngestedItem } from '../types';
import crypto from 'crypto';

interface WikidataBinding {
  item: { value: string };
  itemLabel: { value: string };
  image?: { value: string };
  [key: string]: any;
}

interface WikidataResponse {
  results: {
    bindings: WikidataBinding[];
  };
}

export class AiRealSource implements IngestionSource {
  id: string;
  name: string;
  mode_id: string;
  frequency: 'daily' | 'hourly' | 'manual' = 'daily';
  
  constructor() {
    this.id = 'ai-real-daily';
    this.name = 'AI vs Real Daily';
    this.mode_id = 'ai-real';
  }

  async fetch(): Promise<IngestedItem[]> {
    console.log('Fetching AI vs Real items...');
    const items: IngestedItem[] = [];

    // 1. Fetch Real Images (Wikidata)
    // Target ~50 real images
    const realItems = await this.fetchRealImages(50);
    items.push(...realItems);

    // 2. Generate AI Images (Pollinations)
    // Target ~50 AI images
    const aiItems = await this.generateAiImages(50);
    items.push(...aiItems);

    return items;
  }

  private async fetchRealImages(count: number): Promise<IngestedItem[]> {
    const categories = [
      { id: 'Q515', name: 'City' },
      { id: 'Q8502', name: 'Mountain' },
      { id: 'Q4022', name: 'River' },
      { id: 'Q16521', name: 'Taxon' }, // Animal/Plant
      { id: 'Q811979', name: 'Architecture' }
    ];

    const realItems: IngestedItem[] = [];
    
    // We'll rotate through categories or pick random ones to keep it fresh
    // For now, let's just query a mix. 
    // To ensure freshness daily, we could use a random offset? 
    // Wikidata offsets can be slow/unreliable for large numbers.
    // Better strategy: randomize the sort order or filter by random criteria?
    // Simplest reliable way: Query more than needed and shuffle.
    
    for (const cat of categories) {
      if (realItems.length >= count) break;

      const query = `
        SELECT DISTINCT ?item ?itemLabel ?image WHERE {
          ?item wdt:P31/wdt:P279* wd:${cat.id}; wdt:P18 ?image.
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        } LIMIT 100
      `;
      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
      
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'DailyJudgementBot/1.0', 'Accept': 'application/json' }
        });
        if (!response.ok) continue;
        const data = await response.json() as WikidataResponse;
        
        // Shuffle bindings
        const bindings = data.results.bindings.sort(() => Math.random() - 0.5);
        
        for (const binding of bindings) {
          if (realItems.length >= count) break;
          
          const label = binding.itemLabel?.value;
          const imageUrl = binding.image?.value;
          const wikiUrl = binding.item?.value;

          if (!label || !imageUrl) continue;

          const hash = crypto.createHash('sha256').update(imageUrl).digest('hex');
          
          realItems.push({
            mode_id: this.mode_id,
            prompt_text: 'Is this image Real or AI generated?',
            answer: 'Real',
            choices_json: ['Real', 'AI'],
            asset_type: 'image',
            source_name: 'Wikidata',
            source_url: wikiUrl,
            license: 'cc-by-sa',
            external_id: wikiUrl,
            hash: hash,
            metadata: { imageUrl: imageUrl, choices: ['Real', 'AI'] }
          });
        }
      } catch (err) {
        console.error(`Failed to fetch ${cat.name}:`, err);
      }
    }
    
    return realItems;
  }

  private async generateAiImages(count: number): Promise<IngestedItem[]> {
    const aiItems: IngestedItem[] = [];
    const prompts = [
      'photorealistic mountain landscape', 
      'photorealistic city street', 
      'photorealistic portrait of a person', 
      'photorealistic animal in nature', 
      'photorealistic plate of food', 
      'photorealistic modern architecture', 
      'surreal digital art', 
      'cyberpunk city street', 
      'fantasy forest landscape', 
      'futuristic vehicle',
      'macro photography of insects',
      'underwater coral reef photorealistic',
      'aerial view of a city at night',
      'ancient ruins in a jungle photorealistic',
      'vintage car on a desert road'
    ];

    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 10000000);
      const prompt = prompts[Math.floor(Math.random() * prompts.length)];
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&seed=${seed}&nologo=true&model=flux`;
      
      const hash = crypto.createHash('sha256').update(imageUrl).digest('hex');

      aiItems.push({
        mode_id: this.mode_id,
        prompt_text: 'Is this image Real or AI generated?',
        answer: 'AI',
        choices_json: ['Real', 'AI'],
        asset_type: 'image',
        source_name: 'Pollinations AI',
        source_url: 'https://pollinations.ai',
        license: 'public-domain',
        external_id: `pollinations-${seed}`,
        hash: hash,
        metadata: { imageUrl: imageUrl, choices: ['Real', 'AI'] }
      });
    }

    return aiItems;
  }

  async validate(item: IngestedItem): Promise<boolean> {
    return !!(item.prompt_text && item.metadata?.imageUrl && item.metadata?.choices?.length > 0);
  }
}
