-- Add 'real-or-fake-job' mode
INSERT INTO modes (id, title, description, round_type, active, rules_json)
VALUES (
  'real-or-fake-job', 
  'Real or Fake Job', 
  'Is this a real job title or a made-up one?', 
  'binary', 
  true, 
  '{"choices": ["Real", "Fake"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET active = true;

-- Enable RLS on plays table
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own plays
CREATE POLICY "Users can insert their own plays"
ON plays FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow anon users to insert plays (for guests)
CREATE POLICY "Anon can insert plays"
ON plays FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Allow service role to do anything
CREATE POLICY "Service role full access"
ON plays FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enable RLS on profiles if not already
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
