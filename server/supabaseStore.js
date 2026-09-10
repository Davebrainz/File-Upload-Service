import { createClient } from '@supabase/supabase-js';

const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
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

  const filePath = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.originalname)}`;
  const { error } = await supabase.storage.from(bucketName).upload(filePath, file.buffer, {
    contentType: file.mimetype || 'application/octet-stream',
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Supabase Storage returned an invalid upload response.');
  }

  return { url: data.publicUrl, key: filePath };
}