import Parser from 'rss-parser';
import { IngestionSource, IngestedItem } from '../types';
import crypto from 'crypto';

export class RSSSource implements IngestionSource {
  id: string;
  name: string;
  mode_id: string;
  frequency: 'daily' | 'hourly' | 'manual' = 'hourly';
  url: string;
  category: 'Real' | 'Satire';
  parser: Parser;

  constructor(id: string, name: string, url: string, category: 'Real' | 'Satire') {
    this.id = id;
    this.name = name;
    this.mode_id = 'headline-satire';
    this.url = url;
    this.category = category;
    this.parser = new Parser({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
  }

  async fetch(): Promise<IngestedItem[]> {
    try {
      const feed = await this.parser.parseURL(this.url);
      const items: IngestedItem[] = [];

      for (const entry of feed.items) {
        if (!entry.title || !entry.link || !entry.guid) continue;

        // Create a unique hash for the content to ensure idempotency
        const contentString = `${entry.title}-${entry.link}`;
        const hash = crypto.createHash('sha256').update(contentString).digest('hex');

        items.push({
          mode_id: this.mode_id,
          prompt_text: entry.title,
          answer: this.category,
          asset_type: 'text',
          source_name: this.name,
          source_url: entry.link,
          license: 'fair-use', // Assuming fair use for headlines/links
          external_id: entry.guid,
          hash: hash,
          metadata: {
            pubDate: entry.pubDate,
            snippet: entry.contentSnippet,
          },
        });
      }

      return items;
    } catch (error) {
      console.error(`Error fetching RSS feed from ${this.name}:`, error);
      return [];
    }
  }

  async validate(item: IngestedItem): Promise<boolean> {
    // Basic validation
    if (!item.prompt_text || item.prompt_text.length < 10) return false;
    if (item.mode_id !== 'headline-satire') return false;
    return true;
  }
}
