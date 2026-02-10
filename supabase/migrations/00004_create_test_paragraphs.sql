-- Create table for typing test paragraphs
CREATE TABLE IF NOT EXISTS public.test_paragraphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.test_paragraphs ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read test paragraphs
CREATE POLICY "Anyone can read test paragraphs" ON public.test_paragraphs
  FOR SELECT TO public USING (true);

-- Only admins can manage test paragraphs
CREATE POLICY "Admins can manage test paragraphs" ON public.test_paragraphs
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_test_paragraphs_difficulty ON public.test_paragraphs(difficulty);