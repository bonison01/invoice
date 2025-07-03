-- Create storage bucket for business documents
INSERT INTO storage.buckets (id, name, public) VALUES ('business-docs', 'business-docs', true);

-- Create policies for business documents storage
CREATE POLICY "Business documents are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'business-docs');

CREATE POLICY "Users can upload their own business documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'business-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own business documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'business-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own business documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'business-docs' AND auth.uid()::text = (storage.foldername(name))[1]);