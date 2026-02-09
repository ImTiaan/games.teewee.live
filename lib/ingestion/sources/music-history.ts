
import { IngestionSource, IngestedItem } from '../types';
import crypto from 'crypto';

interface ItunesResult {
  trackId: number;
  artistName: string;
  trackName: string;
  previewUrl: string;
  releaseDate: string;
  primaryGenreName: string;
  artworkUrl100: string;
}

const YEARS = Array.from({ length: 2025 - 1960 + 1 }, (_, i) => 1960 + i);
const GENRES = [
  'Pop', 'Rock', 'Alternative', 'Hip-Hop', 'R&B', 
  'Country', 'Electronic', 'Jazz', 'Soul', 'Metal', 
  'Punk', 'Disco', 'Funk', 'Reggae'
];

export class MusicHistorySource implements IngestionSource {
  id = 'music-history';
  name = 'iTunes Music History';
  mode_id = 'music-history';
  frequency: 'daily' | 'hourly' | 'manual' = 'daily';
  
  async validate(item: IngestedItem): Promise<boolean> {
    return !!item.source_url && !!item.choices_json && Array.isArray(item.choices_json) && item.choices_json.length === 10;
  }
  
  async fetch(): Promise<IngestedItem[]> {
    // Default fetch for daily runs - maybe just a small random set to keep it fresh
    // But for bulk ingestion, we will call 'fetchBulk' manually or use this logic
    // Let's make fetch() do a "Daily Discovery" of ~5 random queries to keep adding content slowly
    // For the 4000 item goal, we will use a separate script calling a bulk method or just run this in a loop
    
    // Pick 5 random Genre+Year combinations for daily ingestion
    const queries = [];
    for (let i = 0; i < 5; i++) {
        const year = YEARS[Math.floor(Math.random() * YEARS.length)];
        const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
        queries.push(`${genre} ${year}`);
    }
    
    return this.processQueries(queries);
  }

  // Public method for bulk ingestion scripts to call
  async fetchBulk(limitQueries: number = 50): Promise<IngestedItem[]> {
      const queries = [];
      // Generate random queries
      for (let i = 0; i < limitQueries; i++) {
        const year = YEARS[Math.floor(Math.random() * YEARS.length)];
        const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
        queries.push(`${genre} ${year}`);
      }
      return this.processQueries(queries);
  }

  private async processQueries(queries: string[]): Promise<IngestedItem[]> {
    const items: IngestedItem[] = [];
    const seenTrackIds = new Set<number>();

    for (const query of queries) {
        console.log(`Processing query: ${query}`);
        try {
            // Fetch batch of tracks
            const tracks = await this.searchItunes(query, 200);
            
            // Filter valid tracks
            const validTracks = tracks.filter(t => t.previewUrl && t.trackName && t.artistName);
            
            if (validTracks.length < 10) {
                console.warn(`Query ${query} returned too few valid tracks (${validTracks.length}). Skipping.`);
                continue;
            }

            // Generate an item for EACH valid track in this batch
            // Use other tracks in the SAME batch as distractors
            for (const target of validTracks) {
                if (seenTrackIds.has(target.trackId)) continue;
                
                // Find distractors from the SAME batch
                // This ensures they are roughly same genre/year (since the query was Genre+Year)
                const uniqueDistractors = new Map<string, string>();
                
                // Shuffle candidates (all valid tracks except target)
                const candidates = validTracks.filter(t => t.trackId !== target.trackId).sort(() => 0.5 - Math.random());
                
                for (const c of candidates) {
                    // Check for same artist
                    if (c.artistName.toLowerCase().includes(target.artistName.toLowerCase()) || 
                        target.artistName.toLowerCase().includes(c.artistName.toLowerCase())) {
                        continue;
                    }

                    // Add unique artist
                    if (!uniqueDistractors.has(c.artistName)) {
                        uniqueDistractors.set(c.artistName, c.trackName);
                    }
                    
                    if (uniqueDistractors.size >= 9) break;
                }

                if (uniqueDistractors.size < 9) {
                    // Not enough unique artist distractors in this batch
                    continue; 
                }

                // Create Item
                 const choices = [
                    `${target.trackName} - ${target.artistName}`,
                    ...Array.from(uniqueDistractors.entries()).map(([artist, track]) => `${track} - ${artist}`)
                  ].sort(() => 0.5 - Math.random());

                  items.push({
                    mode_id: this.id,
                    prompt_text: `Guess the song from the clip`,
                    answer: `${target.trackName} - ${target.artistName}`,
                    choices_json: choices,
                    asset_type: 'audio',
                    source_name: 'iTunes',
                    source_url: target.previewUrl,
                    license: 'Promotional',
                    external_id: target.trackId.toString(),
                    hash: this.generateHash(target.trackId.toString()),
                    metadata: {
                      audioUrl: target.previewUrl,
                      imageUrl: target.artworkUrl100,
                      artist: target.artistName,
                      track: target.trackName,
                      year: new Date(target.releaseDate).getFullYear().toString(),
                      genre: target.primaryGenreName
                    }
                  });
                  
                  seenTrackIds.add(target.trackId);
            }
            
            // Sleep to be nice to API
            await new Promise(r => setTimeout(r, 2000));

        } catch (err) {
            console.error(`Error processing query ${query}:`, err);
        }
    }
    
    return items;
  }

  private async searchItunes(term: string, limit: number): Promise<ItunesResult[]> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 403 || res.status === 429) {
                console.warn(`Rate limited (Status ${res.status}). Waiting 5s...`);
                await new Promise(r => setTimeout(r, 5000));
                // Retry once
                const res2 = await fetch(url);
                if (!res2.ok) throw new Error(`iTunes API error: ${res2.statusText}`);
                const data2: any = await res2.json();
                return data2.results || [];
            }
            throw new Error(`iTunes API error: ${res.statusText}`);
        }
        const data: any = await res.json();
        return data.results || [];
    } catch (e) {
        console.error("Fetch error:", e);
        return [];
    }
  }

  private generateHash(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex');
  }
}
