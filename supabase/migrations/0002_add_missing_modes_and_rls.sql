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

-- 1. Policy: Users can insert their own plays
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'plays' AND policyname = 'Users can insert their own plays'
    ) THEN
        CREATE POLICY "Users can insert their own plays"
        ON plays FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- 2. Policy: Anon can insert plays
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'plays' AND policyname = 'Anon can insert plays'
    ) THEN
        CREATE POLICY "Anon can insert plays"
        ON plays FOR INSERT
        TO anon
        WITH CHECK (user_id IS NULL);
    END IF;
END
$$;

-- 3. Policy: Service role full access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'plays' AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access"
        ON plays FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- Enable RLS on profiles if not already
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Public profiles are viewable by everyone
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
        CREATE POLICY "Public profiles are viewable by everyone"
        ON profiles FOR SELECT
        USING (true);
    END IF;
END
$$;

-- 5. Policy: Users can insert their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
        ON profiles FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

-- 6. Policy: Users can update own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON profiles FOR UPDATE
        USING (auth.uid() = id);
    END IF;
END
$$;
