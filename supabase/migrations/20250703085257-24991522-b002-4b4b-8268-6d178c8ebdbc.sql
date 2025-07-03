-- Add seal and signature fields to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN seal_url TEXT,
ADD COLUMN signature_url TEXT;