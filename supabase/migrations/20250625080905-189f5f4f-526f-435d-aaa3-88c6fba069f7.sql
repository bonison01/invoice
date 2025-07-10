
-- Create a business_settings table for user business information
CREATE TABLE IF NOT EXISTS public.business_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  business_name text NOT NULL DEFAULT 'Your Business Name',
  business_address text,
  business_phone text,
  business_email text,
  logo_url text,
  payment_instructions text DEFAULT 'Payment due within 10 days. Thank you for your business!',
  thank_you_note text DEFAULT 'Thank you for choosing our services.',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on business_settings
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_settings (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'business_settings' 
    AND policyname = 'Users can view their own business settings'
  ) THEN
    CREATE POLICY "Users can view their own business settings" 
      ON public.business_settings 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'business_settings' 
    AND policyname = 'Users can create their own business settings'
  ) THEN
    CREATE POLICY "Users can create their own business settings" 
      ON public.business_settings 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'business_settings' 
    AND policyname = 'Users can update their own business settings'
  ) THEN
    CREATE POLICY "Users can update their own business settings" 
      ON public.business_settings 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Function to create default business settings when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_business_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.business_settings (user_id, business_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'Your Business Name'));
  RETURN NEW;
END;
$$;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created_business_settings'
  ) THEN
    CREATE TRIGGER on_auth_user_created_business_settings
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_business_settings();
  END IF;
END$$;
