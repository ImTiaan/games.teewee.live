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

export class WikidataSource implements IngestionSource {
  id: string;
  name: string;
  mode_id: string;
  frequency: 'daily' | 'hourly' | 'manual' = 'daily';
  query: string;
  promptTemplate: string;
  
  constructor(id: string, name: string, mode_id: string, query: string, promptTemplate?: string) {
    this.id = id;
    this.name = name;
    this.mode_id = mode_id;
    this.query = query;
    this.promptTemplate = promptTemplate || `What is this ${name.toLowerCase()}?`;
  }

  async fetch(): Promise<IngestedItem[]> {
    try {
      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(this.query)}&format=json`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DailyJudgementBot/1.0 (teewee.live)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Wikidata API error: ${response.statusText}`);
      }

      const data = await response.json() as WikidataResponse;
      const bindings = data.results.bindings;
      const items: IngestedItem[] = [];

      // We need at least 4 items to create a question with 3 distractors
      if (bindings.length < 4) {
        console.warn(`Not enough items found for ${this.name} (found ${bindings.length})`);
        return [];
      }

      // Deduplicate items by hash
      const uniqueItems = new Map<string, IngestedItem>();

      for (const binding of bindings) {
        const label = binding.itemLabel?.value;
        const imageUrl = binding.image?.value;
        const wikiUrl = binding.item?.value;

        if (!label || !imageUrl) continue;

        // Generate distractors
        const choices = this.generateChoices(label, bindings);
        
        // Unique hash: image URL + label
        const contentString = `${imageUrl}-${label}`;
        const hash = crypto.createHash('sha256').update(contentString).digest('hex');

        if (!uniqueItems.has(hash)) {
          uniqueItems.set(hash, {
            mode_id: this.mode_id,
            prompt_text: this.promptTemplate,
            answer: label,
            choices_json: choices,
            asset_type: 'image',
            source_name: 'Wikidata',
            source_url: wikiUrl,
            license: 'cc-by-sa', // Wikidata content is CC0, images vary but usually compatible
            external_id: wikiUrl,
            hash: hash,
            metadata: {
              imageUrl: imageUrl,
              choices: choices // Duplicate for safety/ease of access
            }
          });
        }
      }

      return Array.from(uniqueItems.values());
    } catch (error) {
      console.error(`Error fetching Wikidata for ${this.name}:`, error);
      return [];
    }
  }

  private generateChoices(correctAnswer: string, allBindings: WikidataBinding[]): string[] {
    const distractors: string[] = [];
    const available = allBindings.filter(b => b.itemLabel?.value !== correctAnswer);
    
    // Pick 3 random distractors
    while (distractors.length < 3 && available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      const choice = available[randomIndex].itemLabel?.value;
      if (choice && !distractors.includes(choice)) {
        distractors.push(choice);
      }
      // Remove to avoid duplicates
      available.splice(randomIndex, 1);
    }

    // Shuffle correct answer + distractors
    const choices = [...distractors, correctAnswer];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    
    return choices;
  }

  async validate(item: IngestedItem): Promise<boolean> {
    return !!(item.prompt_text && item.metadata?.imageUrl && item.metadata?.choices?.length === 4);
  }
}
