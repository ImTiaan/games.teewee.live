
import crypto from 'crypto';
import { IngestedItem, IngestionSource } from '../types';

export class StaticTextSource implements IngestionSource {
  id: string;
  name: string;
  mode_id: string;
  frequency: 'manual' = 'manual';
  category: string;
  
  private staticItems: Array<{ text: string; answer: string; metadata?: Record<string, any> }>;

  constructor(
    id: string, 
    name: string, 
    mode_id: string, 
    category: string, // e.g., "Real" or "Fictional"
    items: Array<{ text: string; answer?: string; metadata?: Record<string, any> }>
  ) {
    this.id = id;
    this.name = name;
    this.mode_id = mode_id;
    this.category = category;
    this.staticItems = items.map(item => ({
      ...item,
      answer: item.answer || category
    }));
  }

  async fetch(): Promise<IngestedItem[]> {
    return this.staticItems.map(item => {
      // Create a unique hash based on content and category
      const contentString = `${item.text}-${this.category}-${this.mode_id}`;
      const hash = crypto.createHash('sha256').update(contentString).digest('hex');

      return {
        mode_id: this.mode_id,
        prompt_text: item.text,
        answer: item.answer,
        asset_type: 'text',
        source_name: this.name,
        source_url: 'https://games.teewee.live', // Internal source
        license: 'cc0',
        external_id: hash,
        hash: hash,
        metadata: item.metadata
      };
    });
  }

  async validate(item: IngestedItem): Promise<boolean> {
    return true;
  }
}
