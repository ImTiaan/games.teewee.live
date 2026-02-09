
-- 1. Add 'is_headline' to modes
ALTER TABLE modes ADD COLUMN IF NOT EXISTS is_headline BOOLEAN DEFAULT false;

-- Set 'headline-satire' as the headline game (default)
UPDATE modes SET is_headline = true WHERE id = 'headline-satire';

-- 2. Create Profiles table (for User Tracking)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username', new.raw_user_meta_data->>'full_name'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Leaderboard View (Threshold: 25 plays)
CREATE OR REPLACE VIEW view_leaderboard AS
SELECT 
  p.user_id,
  pr.username,
  pr.avatar_url,
  COUNT(*) as total_plays,
  SUM(CASE WHEN p.is_correct THEN 1 ELSE 0 END) as correct_plays,
  (SUM(CASE WHEN p.is_correct THEN 1 ELSE 0 END)::FLOAT / COUNT(*)) * 100 as win_rate
FROM plays p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.user_id IS NOT NULL
GROUP BY p.user_id, pr.username, pr.avatar_url
HAVING COUNT(*) >= 25;
