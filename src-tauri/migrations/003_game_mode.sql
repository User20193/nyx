ALTER TABLE chats ADD COLUMN game_mode TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE chats ADD COLUMN game_state TEXT;
ALTER TABLE chats ADD COLUMN initial_state TEXT;
ALTER TABLE chats ADD COLUMN author_note TEXT;
ALTER TABLE chats ADD COLUMN scenario_id TEXT;
ALTER TABLE chats ADD COLUMN scenario_prompt TEXT;
ALTER TABLE chats ADD COLUMN player_role TEXT;
