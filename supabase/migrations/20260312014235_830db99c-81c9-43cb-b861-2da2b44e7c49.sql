-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('treino', 'jogo')),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  maps_link TEXT,
  total_price NUMERIC NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 10,
  share_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_responses table (for both logged-in users and anonymous guests)
CREATE TABLE public.event_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('sim', 'talvez', 'nao')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT response_has_identity CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL)
);

-- Create unique constraint to prevent duplicate responses
CREATE UNIQUE INDEX idx_unique_user_response ON public.event_responses(event_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_unique_guest_response ON public.event_responses(event_id, guest_name) WHERE guest_name IS NOT NULL;

-- Create index on share_token for fast lookups
CREATE UNIQUE INDEX idx_events_share_token ON public.events(share_token);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_responses ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update their events" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Owners can delete their events" ON public.events FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Event responses policies
CREATE POLICY "Anyone can view responses" ON public.event_responses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can respond" ON public.event_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anonymous guests can respond" ON public.event_responses FOR INSERT TO anon WITH CHECK (user_id IS NULL AND guest_name IS NOT NULL);
CREATE POLICY "Users can update own response" ON public.event_responses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anon can update guest response" ON public.event_responses FOR UPDATE TO anon USING (user_id IS NULL AND guest_name IS NOT NULL);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_responses_updated_at BEFORE UPDATE ON public.event_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();