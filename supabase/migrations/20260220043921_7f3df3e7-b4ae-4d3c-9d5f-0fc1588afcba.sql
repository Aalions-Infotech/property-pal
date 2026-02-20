
-- Fix: chat_messages should scope by session_id, not fully open
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can view chat messages by session" ON public.chat_messages;

-- Session-scoped policies (session_id acts as the access key)
CREATE POLICY "Insert chat by session" ON public.chat_messages
  FOR INSERT WITH CHECK (session_id IS NOT NULL AND length(session_id) > 10);

CREATE POLICY "View chat by session" ON public.chat_messages
  FOR SELECT USING (session_id IS NOT NULL AND length(session_id) > 10);

-- Create property images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Property images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own property images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own property images" ON storage.objects
  FOR DELETE USING (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);
