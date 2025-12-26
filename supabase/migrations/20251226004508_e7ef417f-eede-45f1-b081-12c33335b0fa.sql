-- Create table to track monthly image generation usage per user
CREATE TABLE IF NOT EXISTS public.image_usage_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  images_generated integer NOT NULL DEFAULT 0,
  plan_limit integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT image_usage_monthly_user_period_unique UNIQUE (user_id, period_start)
);

-- Enable RLS
ALTER TABLE public.image_usage_monthly ENABLE ROW LEVEL SECURITY;

-- Policy: users can view their own usage
CREATE POLICY "Users can view own image usage" ON public.image_usage_monthly
FOR SELECT USING (auth.uid() = user_id);

-- Policy: users can insert their own usage rows
CREATE POLICY "Users can insert own image usage" ON public.image_usage_monthly
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own usage rows
CREATE POLICY "Users can update own image usage" ON public.image_usage_monthly
FOR UPDATE USING (auth.uid() = user_id);

-- Generic function to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for image_usage_monthly
DROP TRIGGER IF EXISTS update_image_usage_monthly_updated_at ON public.image_usage_monthly;
CREATE TRIGGER update_image_usage_monthly_updated_at
BEFORE UPDATE ON public.image_usage_monthly
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();