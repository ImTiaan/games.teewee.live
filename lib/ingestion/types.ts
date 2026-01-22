export interface IngestedItem {
  mode_id: string;
  prompt_text: string;
  answer: string;
  choices_json?: Record<string, any> | string[]; // Can be flexible depending on mode
  asset_type: 'text' | 'image' | 'audio' | 'video';
  blob_url?: string; // If fetched/uploaded
  source_name: string;
  source_url: string;
  license: string;
  external_id: string; // Unique ID from source to prevent re-fetching
  hash: string; // Content hash for idempotency
  metadata?: Record<string, any>;
}

export interface IngestionSource {
  id: string;
  name: string;
  mode_id: string;
  frequency: 'daily' | 'hourly' | 'manual';
  
  /**
   * Fetch new items from the source.
   * Should return a list of raw items or directly IngestedItems.
   */
  fetch(): Promise<IngestedItem[]>;
  
  /**
   * Validate if an item is suitable for the game.
   */
  validate(item: IngestedItem): Promise<boolean>;
}

export interface IngestionResult {
  source_id: string;
  items_found: number;
  items_ingested: number;
  items_skipped: number; // Duplicates or invalid
  errors: string[];
}
