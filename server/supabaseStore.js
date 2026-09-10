import { createClient } from '@supabase/supabase-js';

const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'Davebrainz'; // Default to your bucket
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseStorage = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = hasSupabaseStorage ? createClient(supabaseUrl, supabaseAnonKey) : null;

function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadFile(file) {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  if (!file) {
    throw new Error('No file provided');
  }

  const fileName = `public/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
  
  const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  
  if (!urlData?.publicUrl) {
    throw new Error('Supabase Storage returned an invalid upload response.');
  }

  return { url: urlData.publicUrl, key: fileName };
}