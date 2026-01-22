# Daily Judgement Arcade
**Full Technical Specification & Narrative**
*(Vercel + Vercel Blob + Supabase Free Tier, Fully Automated Ingestion)*

---

## 1. Executive Narrative

### What this website is
**Daily Judgement Arcade** is a single destination for short, instinct-driven web games that test perception, bias, and pattern recognition. Each game presents one question at a time and asks the player to make a judgement based on limited information.

The experience is:
- Fast (seconds per round)
- Lightweight (browser-first)
- Repeatable (daily packs)
- Comparable (scores, streaks, leaderboards)

Each “game” is a **mode**, but all modes share the same infrastructure, ingestion pipeline, scoring system, and daily publishing logic.

---

### Core design philosophy
1. **One site, many lenses**
   Different games explore different types of judgement, but feel like one cohesive product.

2. **Daily determinism**
   Every day has a fixed set of rounds. Everyone sees the same content.

3. **Automated freshness**
   Content is continuously ingested from *safe, friendly, permission-aligned public sources*.

4. **Zero manual curation**
   No hand uploads. No manual reviews in normal operation.

5. **Explainable & auditable**
   Every item has provenance, attribution, and a takedown path.

---

## 2. Game Modes (Initial Set)

All modes conform to the same **Round Interface**.

### Binary judgement modes
- **Professional Profile or Criminal Listing**
- **AI Image or Real Photo**
- **True Headline or Satire**
- **Real Animal or Fictional Creature**
- **Real Job or Fake Job**
- **Human-Written or Machine-Written**

### Multi-choice judgement modes
- **Guess the City**
- **Guess the Landmark**
- **Guess the Era**
- **Guess the Industry**
- **Guess the Country**

### Common properties
- Single prompt
- Limited time (optional)
- Immediate feedback
- Score impact
- Optional explanation after answer

---

## 3. User Experience Flow

### Home
- Today’s featured modes
- “Play Daily Pack”
- Streak indicator
- Mode list

### Daily Pack
- One round per active mode
- Fixed order
- Shared seed for all players
- Results summary at end

### Mode Page
- Infinite (but rate-limited) play
- Pulls from historical pool, not daily pack

### Results
- Accuracy
- Time
- Bias insights (optional)
- Shareable summary card

---

## 4. System Architecture

### Stack Overview
- **Frontend & API:** Next.js on Vercel
- **Storage (Assets):** Vercel Blob
- **Database:** Supabase (Postgres, free tier)
- **Automation:** Vercel Scheduled Functions
- **Auth (Optional):** Supabase Auth
- **No other paid services**

---

## 5. Data Model (Supabase)

### `modes`
```sql
id TEXT PRIMARY KEY
title TEXT
description TEXT
round_type TEXT CHECK (round_type IN ('binary','multi'))
active BOOLEAN
rules_json JSONB
```

### `items`
Represents a single playable unit.
```sql
id UUID PRIMARY KEY
mode_id TEXT REFERENCES modes(id)
prompt_text TEXT
answer TEXT
choices_json JSONB
asset_type TEXT
blob_url TEXT
source_name TEXT
source_url TEXT
license TEXT
hash TEXT UNIQUE
quality_score INT
status TEXT CHECK (status IN ('active','quarantined','retired'))
created_at TIMESTAMP
```

### `daily_sets`
```sql
date DATE PRIMARY KEY
seed BIGINT
snapshot_blob_url TEXT
created_at TIMESTAMP
```

### `daily_set_items`
```sql
date DATE
mode_id TEXT
item_id UUID
position INT
PRIMARY KEY (date, mode_id, position)
```

### `plays`
```sql
id UUID PRIMARY KEY
date DATE
mode_id TEXT
item_id UUID
session_id TEXT
user_id UUID NULL
answer_given TEXT
is_correct BOOLEAN
time_ms INT
created_at TIMESTAMP
```

### `leaderboards_daily`
```sql
date DATE
mode_id TEXT
session_id TEXT
score INT
correct INT
played INT
avg_time_ms INT
PRIMARY KEY (date, mode_id, session_id)
```

## 6. Asset Storage (Vercel Blob)

**Stored objects:**
- Images
- Thumbnails
- Daily snapshot JSONs
- Scraped raw payloads (optional, compressed)

**Naming scheme:**
- `/assets/{mode}/{yyyy}/{mm}/{uuid}.jpg`
- `/snapshots/{yyyy-mm-dd}.json`
- `/raw/{source}/{timestamp}.json.gz`

## 7. Automated Ingestion System (MANDATORY)

### Principles
- Only scrape public, permission-aligned sources
- Respect robots.txt
- Rate-limited
- Attribution preserved
- Deterministic transforms
- Idempotent ingestion

### Ingestion Pipeline (Per Source)
1. **Discovery**
   - RSS / Atom feeds
   - Public dataset indexes
   - Paginated public listings
   - Static HTML pages with stable structure

2. **Fetch**
   - Scheduled function
   - ETag / Last-Modified respected
   - Strict request budget

3. **Normalize**
   - Extract text / image / metadata
   - Convert to internal item schema
   - Compute content hash

4. **Validate**
   - Required fields present
   - Answer determinable
   - No PII beyond public figures
   - Licence compatible

5. **Store**
   - Upload asset to Blob
   - Insert metadata row
   - Skip duplicates automatically

6. **Score**
   - Initial quality score assigned
   - Confidence flags set

### Example Safe Source Types
| Mode | Source Type |
|---|---|
| Headlines | Public news RSS feeds |
| Satire | Known satire RSS feeds |
| AI Images | Open AI image datasets |
| Real Images | Public domain photo archives |
| Cities | Open geodata datasets |
| Jobs | Public job taxonomy datasets |
| Text | Open licensed corpora |

## 8. Quality Control (Automated)

### Passive signals
- Accuracy deviation
- Skip rate
- Time-to-answer anomalies
- Player disagreement clustering

### Automated actions
- Down-rank low-quality items
- Quarantine suspicious items
- Retire stale items

**No manual review required for normal operation.**

## 9. Daily Publishing System

### Daily Cron (00:05 UTC)
1. Generate seed for the day
2. For each active mode:
   - Select N items (weighted random)
   - Exclude recent items
   - Write `daily_set_items`
3. Generate immutable snapshot JSON
4. Upload snapshot to Blob
5. Lock the day

### Snapshot structure:
```json
{
  "date": "2026-01-21",
  "seed": 123456789,
  "modes": {
    "ai-or-real": [
      { "id": "...", "blob_url": "...", "choices": [...] }
    ]
  }
}
```

## 10. Gameplay API

- `GET /api/daily`
  Returns snapshot from Blob.
- `POST /api/play`
  Logs a play and returns correctness.
- `GET /api/leaderboard`
  Aggregated daily scores.
- `GET /api/mode/:id`
  Returns playable pool for infinite mode play.

## 11. Caching & Performance
- Daily snapshots served from CDN
- Leaderboards cached (30–120s)
- Images resized at ingestion
- No runtime scraping

## 12. Legal & Safety Guardrails
- Attribution stored per item
- Source URL preserved
- DMCA / takedown endpoint
- Automated source disable switch
- No private individuals
- No biometric inference

## 13. Scalability Characteristics
- Add new modes without schema changes
- Add new sources without frontend changes
- Blob handles growth, DB stays lean
- Cron-driven, not event-heavy

## 14. Future Extensions (Non-Blocking)
- Bias insights per player
- Mode difficulty tiers
- Weekly packs
- Themed days
- Multiplayer live modes

## 15. Summary
This system delivers:
- A unified, addictive daily games platform
- Fully automated, safe content ingestion
- Zero manual curation
- Minimal paid infrastructure
- Strong legal and operational hygiene

It is designed to scale in content volume, game variety, and player count without changing its core architecture.
