-- Initial Game Modes Seed
INSERT INTO modes (id, title, description, round_type, active, rules_json) VALUES
('headline-satire', 'True Headline or Satire', 'Can you distinguish real news from satire?', 'binary', true, '{"choices": ["Real", "Satire"]}'::jsonb),
('ai-real', 'AI Image or Real Photo', 'Spot the AI generation details.', 'binary', true, '{"choices": ["Real", "AI"]}'::jsonb),
('profile-criminal', 'Professional or Criminal', 'Judge the book by its cover. Who is the criminal?', 'binary', false, '{"choices": ["Professional", "Criminal"]}'::jsonb),
('animal-fictional', 'Real Animal or Fictional', 'Evolution is wilder than fiction. Or is it?', 'binary', false, '{"choices": ["Real", "Fictional"]}'::jsonb),
('guess-city', 'Guess the City', 'Identify the city from the street view or skyline.', 'multi', false, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
