import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { DailyGenerator } from '../lib/game/daily-generator';

async function run() {
  const args = process.argv.slice(2);
  let dateStr = args[0];

  if (!dateStr) {
    const today = new Date();
    dateStr = today.toISOString().split('T')[0];
  }

  // Basic validation YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.error('Invalid date format. Use YYYY-MM-DD');
    process.exit(1);
  }

  try {
    const generator = new DailyGenerator();
    await generator.generate(dateStr);
  } catch (error) {
    console.error('Generation failed:', error);
    process.exit(1);
  }
}

run();
