DO $$
DECLARE
  mode_ids TEXT[] := ARRAY['guess-the-city', 'guess-city', 'guess-the-landmark', 'ai-real', 'human-machine'];
BEGIN
  DELETE FROM leaderboards_daily WHERE mode_id = ANY(mode_ids);
  DELETE FROM plays WHERE mode_id = ANY(mode_ids);
  DELETE FROM daily_set_items WHERE mode_id = ANY(mode_ids);
  DELETE FROM items WHERE mode_id = ANY(mode_ids);
  DELETE FROM modes WHERE id = ANY(mode_ids);
END
$$;
