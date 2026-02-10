DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM modes WHERE id = 'job-fake') THEN
    UPDATE modes SET active = true WHERE id = 'job-fake';
    UPDATE modes SET active = false WHERE id = 'real-or-fake-job';
  END IF;
END
$$;
