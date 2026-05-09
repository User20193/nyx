-- Add avatar_seed for chat circle avatar generation
ALTER TABLE chats ADD COLUMN avatar_seed TEXT;
ALTER TABLE chats ADD COLUMN avatar_style TEXT NOT NULL DEFAULT 'beam';
