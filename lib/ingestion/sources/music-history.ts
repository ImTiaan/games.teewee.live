
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

const SEED_QUERIES = [
  // Classic Rock / Pop
  { term: 'Bohemian Rhapsody Queen', year: '1975' },
  { term: 'Billie Jean Michael Jackson', year: '1982' },
  { term: 'Smells Like Teen Spirit Nirvana', year: '1991' },
  { term: 'Hotel California Eagles', year: '1976' },
  { term: 'Sweet Child O Mine Guns N Roses', year: '1987' },
  { term: 'Imagine John Lennon', year: '1971' },
  { term: 'Like a Prayer Madonna', year: '1989' },
  { term: 'Purple Rain Prince', year: '1984' },
  { term: 'Hey Jude Beatles', year: '1968' },
  { term: 'Wonderwall Oasis', year: '1995' },
  // 80s
  { term: 'Take on Me a-ha', year: '1985' },
  { term: 'Livin on a Prayer Bon Jovi', year: '1986' },
  { term: 'Every Breath You Take Police', year: '1983' },
  { term: 'With or Without You U2', year: '1987' },
  { term: 'Don\'t Stop Believin Journey', year: '1981' },
  { term: 'Africa Toto', year: '1982' },
  { term: 'Eye of the Tiger Survivor', year: '1982' },
  { term: 'Girls Just Want to Have Fun Cyndi Lauper', year: '1983' },
  { term: 'Beat It Michael Jackson', year: '1982' },
  { term: 'I Wanna Dance with Somebody Whitney Houston', year: '1987' },
  // 90s
  { term: 'Losing My Religion REM', year: '1991' },
  { term: 'Creep Radiohead', year: '1992' },
  { term: 'I Will Always Love You Whitney Houston', year: '1992' },
  { term: 'Vogue Madonna', year: '1990' },
  { term: 'Enter Sandman Metallica', year: '1991' },
  { term: 'Black Hole Sun Soundgarden', year: '1994' },
  { term: 'Don\'t Speak No Doubt', year: '1995' },
  { term: 'Wannabe Spice Girls', year: '1996' },
  { term: 'Bitter Sweet Symphony The Verve', year: '1997' },
  { term: '...Baby One More Time Britney Spears', year: '1998' },
  // 00s
  { term: 'Hey Ya! OutKast', year: '2003' },
  { term: 'Seven Nation Army White Stripes', year: '2003' },
  { term: 'Mr. Brightside Killers', year: '2004' },
  { term: 'Crazy in Love Beyoncé', year: '2003' },
  { term: 'Umbrella Rihanna', year: '2007' },
  { term: 'Toxic Britney Spears', year: '2003' },
  { term: 'Lose Yourself Eminem', year: '2002' },
  { term: 'Clocks Coldplay', year: '2002' },
  { term: 'Rehab Amy Winehouse', year: '2006' },
  { term: 'Viva La Vida Coldplay', year: '2008' },
  // 2010s
  { term: 'Rolling in the Deep Adele', year: '2010' },
  { term: 'Get Lucky Daft Punk', year: '2013' },
  { term: 'Uptown Funk Mark Ronson', year: '2014' },
  { term: 'Royals Lorde', year: '2013' },
  { term: 'Happy Pharrell Williams', year: '2013' },
  { term: 'Thinking Out Loud Ed Sheeran', year: '2014' },
  { term: 'Blinding Lights The Weeknd', year: '2019' },
  { term: 'Bad Guy Billie Eilish', year: '2019' },
  { term: 'Old Town Road Lil Nas X', year: '2019' },
  { term: 'Despacito Luis Fonsi', year: '2017' }
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
    const items: IngestedItem[] = [];

    for (const seed of SEED_QUERIES) {
      try {
        // 1. Fetch Target Track
        const targetTracks = await this.searchItunes(seed.term, 1);
        if (targetTracks.length === 0) continue;
        
        const target = targetTracks[0];
        if (!target.previewUrl) continue;

        // 2. Fetch Distractors (Same Genre + Era)
        // Search term: Genre + Year (e.g., "Rock 1975")
        const distractorTerm = `${target.primaryGenreName} ${seed.year}`;
        const candidates = await this.searchItunes(distractorTerm, 200); // Increased from 100

        // Filter distractors
        const targetYear = new Date(target.releaseDate).getFullYear();
        
        const uniqueDistractors = new Map<string, string>(); // Artist -> Track Name
        
        for (const c of candidates) {
          // Skip target artist
          if (c.artistName.toLowerCase().includes(target.artistName.toLowerCase()) || 
              target.artistName.toLowerCase().includes(c.artistName.toLowerCase())) {
            continue;
          }

          // Check Year (+/- 10 years) - Relaxed from 5
          const cYear = new Date(c.releaseDate).getFullYear();
          if (Math.abs(cYear - targetYear) > 10) continue;

          // Add if artist not yet used
          if (!uniqueDistractors.has(c.artistName)) {
            uniqueDistractors.set(c.artistName, c.trackName);
          }
          
          if (uniqueDistractors.size >= 9) break;
        }

        if (uniqueDistractors.size < 9) {
            console.warn(`Not enough distractors for ${target.trackName} (${uniqueDistractors.size}/9)`);
            continue;
        }

        // Format choices
        const choices = [
          `${target.trackName} - ${target.artistName}`,
          ...Array.from(uniqueDistractors.entries()).map(([artist, track]) => `${track} - ${artist}`)
        ].sort(() => 0.5 - Math.random()); // Shuffle

        items.push({
          mode_id: this.id,
          prompt_text: `Guess the song from the clip. (Starts with 1s)`,
          answer: `${target.trackName} - ${target.artistName}`,
          choices_json: choices,
          asset_type: 'audio',
          source_name: 'iTunes',
          source_url: target.previewUrl, // Using previewUrl as the "source" for playback
          license: 'Promotional',
          external_id: target.trackId.toString(),
          hash: this.generateHash(target.trackId.toString()),
          metadata: {
            audioUrl: target.previewUrl,
            imageUrl: target.artworkUrl100, // Show album art on reveal?
            artist: target.artistName,
            track: target.trackName,
            year: seed.year,
            genre: target.primaryGenreName
          }
        });

      } catch (err) {
        console.error(`Error processing seed ${seed.term}:`, err);
      }
    }

    return items;
  }

  private async searchItunes(term: string, limit: number): Promise<ItunesResult[]> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`iTunes API error: ${res.statusText}`);
    const data: any = await res.json();
    return data.results;
  }

  private generateHash(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex');
  }
}
