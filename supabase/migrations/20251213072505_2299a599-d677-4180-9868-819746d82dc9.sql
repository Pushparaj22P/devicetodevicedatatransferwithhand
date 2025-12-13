-- Create gesture_sessions table for storing active transfer sessions
CREATE TABLE public.gesture_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gesture_hash TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('text', 'contact', 'credentials', 'link')),
    data_title TEXT,
    data_content TEXT NOT NULL,
    encrypted_content TEXT,
    encryption_key TEXT,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '60 seconds'),
    matched_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups by gesture hash
CREATE INDEX idx_gesture_sessions_hash ON public.gesture_sessions(gesture_hash);
CREATE INDEX idx_gesture_sessions_status ON public.gesture_sessions(status);
CREATE INDEX idx_gesture_sessions_expires ON public.gesture_sessions(expires_at);

-- Enable Row Level Security (public access for anonymous gesture matching)
ALTER TABLE public.gesture_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create sessions (anonymous gesture sharing)
CREATE POLICY "Anyone can create sessions"
ON public.gesture_sessions
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read active sessions (for matching)
CREATE POLICY "Anyone can read active sessions"
ON public.gesture_sessions
FOR SELECT
USING (status IN ('waiting', 'matched') AND expires_at > now());

-- Allow anyone to update session status (for matching)
CREATE POLICY "Anyone can update session status"
ON public.gesture_sessions
FOR UPDATE
USING (expires_at > now());

-- Enable realtime for gesture_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.gesture_sessions;