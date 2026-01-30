
import { IngestionSource, IngestedItem } from '../types';
import crypto from 'crypto';

interface UrbanEntry {
  definition: string;
  permalink: string;
  thumbs_up: number;
  sound_urls: string[];
  author: string;
  word: string;
  defid: number;
  current_vote: string;
  written_on: string;
  example: string;
  thumbs_down: number;
}

export class UrbanDictionarySource implements IngestionSource {
  id = 'urban-dictionary-random';
  name = 'Urban Dictionary (Random)';
  mode_id = 'urban-dictionary';
  frequency = 'daily' as const;

  async fetch(): Promise<IngestedItem[]> {
    try {
      // Fetch random words
      const response = await fetch('https://api.urbandictionary.com/v0/random');
      if (!response.ok) {
        throw new Error(`Failed to fetch from Urban Dictionary: ${response.statusText}`);
      }

      const data = await response.json();
      const list: UrbanEntry[] = data.list || [];
      
      const items: IngestedItem[] = [];

      // Process each entry
      for (let i = 0; i < list.length; i++) {
        const entry = list[i];
        
        // Basic filtering
        if (!this.isValidEntry(entry)) continue;

        // Redact the word from the definition
        const redactedDefinition = this.redactWord(entry.definition, entry.word);

        // Pick 3 distractors from the other items in the list
        // Filter out the current word and any duplicates
        const potentialDistractors = list
          .filter(e => e.word.toLowerCase() !== entry.word.toLowerCase())
          .map(e => e.word);
        
        // Deduplicate distractors (case-insensitive)
        const uniqueDistractors = Array.from(new Set(potentialDistractors.map(w => w.toLowerCase())))
          .map(w => potentialDistractors.find(p => p.toLowerCase() === w)!);

        if (uniqueDistractors.length < 3) continue;

        // Shuffle and pick 3
        const shuffledDistractors = uniqueDistractors.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        // Create choices array (Correct + 3 Distractors)
        // We'll shuffle them in the game client or here? 
        // The IngestedItem choices_json is usually the set of options presented to user.
        // Let's shuffle them here so they are fixed per item.
        const choices = [entry.word, ...shuffledDistractors].sort(() => 0.5 - Math.random());

        const item: IngestedItem = {
          mode_id: this.mode_id,
          prompt_text: redactedDefinition,
          answer: entry.word,
          choices_json: choices,
          asset_type: 'text',
          source_name: 'Urban Dictionary',
          source_url: entry.permalink,
          license: 'Public Domain', // Urban Dictionary content license is a bit fuzzy, but usually user generated.
          external_id: entry.defid.toString(),
          hash: this.generateHash(entry.defid.toString()),
          metadata: {
            thumbs_up: entry.thumbs_up,
            thumbs_down: entry.thumbs_down,
            author: entry.author,
            example: entry.example,
            pubDate: entry.written_on
          }
        };

        items.push(item);
      }

      return items;
    } catch (error) {
      console.error('Error fetching Urban Dictionary items:', error);
      return [];
    }
  }

  async validate(item: IngestedItem): Promise<boolean> {
    // Additional validation if needed
    if (item.prompt_text.length > 500) return false; // Too long
    if (item.prompt_text.length < 10) return false;  // Too short
    return true;
  }

  private isValidEntry(entry: UrbanEntry): boolean {
    // Must have more likes than dislikes? Or at least some likes?
    // Let's say at least 50% positive if total votes > 10
    const totalVotes = entry.thumbs_up + entry.thumbs_down;
    if (totalVotes > 10 && entry.thumbs_up < entry.thumbs_down) return false;
    
    // Skip if word is in definition but couldn't be redacted (simple check)
    // Actually redactWord handles it, but if the definition IS just the word, skip.
    if (entry.definition.trim().toLowerCase() === entry.word.toLowerCase()) return false;

    return true;
  }

  private redactWord(text: string, word: string): string {
    // Escape regex special characters in word
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create regex for case-insensitive replacement
    const regex = new RegExp(escapedWord, 'gi');
    
    return text.replace(regex, '[___]');
  }

  private generateHash(id: string): string {
    return crypto.createHash('md5').update(id).digest('hex');
  }
}
