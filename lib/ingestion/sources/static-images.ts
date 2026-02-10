import { IngestionSource, IngestedItem } from '../types';
import crypto from 'crypto';

export class StaticImageSource implements IngestionSource {
  id: string;
  name: string;
  mode_id: string;
  frequency = 'manual' as const;
  category: 'Real' | 'AI';
  
  private staticImages: Array<{ url: string; title: string; photographer: string }>;

  constructor(id: string, name: string, category: 'Real' | 'AI', images: Array<{ url: string; title: string; photographer: string }>) {
    this.id = id;
    this.name = name;
    this.mode_id = 'ai-real';
    this.category = category;
    this.staticImages = images;
  }

  async fetch(): Promise<IngestedItem[]> {
    return this.staticImages.map(img => {
      const contentString = `${img.url}-${this.category}`;
      const hash = crypto.createHash('sha256').update(contentString).digest('hex');

      return {
        mode_id: this.mode_id,
        prompt_text: "Is this image Real or AI?", // The prompt for the game
        answer: this.category,
        asset_type: 'image',
        source_name: this.name,
        source_url: img.url,
        license: 'unsplash-license', // or 'public-domain'
        external_id: hash, // Use hash as ID for static items
        hash: hash,
        metadata: {
          photographer: img.photographer,
          imageUrl: img.url // Frontend will use this to display
        }
      };
    });
  }

  async validate(item: IngestedItem): Promise<boolean> {
    return Boolean(item);
  }
}
