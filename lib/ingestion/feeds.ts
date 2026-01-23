import { RSSSource } from './sources/rss';
import { WIKIDATA_FEEDS } from './wikidata-feeds';
import { AiRealSource } from './sources/ai-real-source';

export const HEADLINE_FEEDS = [
  // Real News
  new RSSSource('bbc-news', 'BBC News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'Real'),
  new RSSSource('nyt-world', 'NYT World', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', 'Real'),
  
  // Satire
  new RSSSource('onion', 'The Onion', 'https://www.theonion.com/rss', 'Satire'),
  new RSSSource('beaverton', 'The Beaverton', 'https://www.thebeaverton.com/feed/', 'Satire'),
  new RSSSource('daily-mash', 'The Daily Mash', 'https://www.thedailymash.co.uk/feed', 'Satire'),
  new RSSSource('babylon-bee', 'The Babylon Bee', 'https://babylonbee.com/feed', 'Satire'),
  new RSSSource('new-yorker-borowitz', 'The Borowitz Report', 'https://www.newyorker.com/feed/humor/borowitz-report', 'Satire'),
  new RSSSource('reductress', 'Reductress', 'https://reductress.com/feed/', 'Satire'),
  new RSSSource('duffel-blog', 'Duffel Blog', 'https://www.duffelblog.com/feed', 'Satire'),
  new RSSSource('betoota', 'The Betoota Advocate', 'https://www.betootaadvocate.com/feed/', 'Satire'),
  new RSSSource('chaser', 'The Chaser', 'https://chaser.com.au/feed/', 'Satire'),
  new RSSSource('waterford-whispers', 'Waterford Whispers News', 'https://waterfordwhispersnews.com/feed/', 'Satire')
];

export const ALL_FEEDS = [
  ...HEADLINE_FEEDS,
  ...WIKIDATA_FEEDS,
  new AiRealSource()
];
