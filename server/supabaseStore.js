import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
const usersFileName = 'private/users.json';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const uploadsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads');
const isServerlessRuntime = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME,
);

export const hasSupabaseStorage = Boolean(supabaseUrl && supabaseKey);
const supabase = hasSupabaseStorage ? createClient(supabaseUrl, supabaseKey) : null;

function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function uploadLocally(file, fileName) {
  const destination = path.join(uploadsDirectory, fileName);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, file.buffer);
  return { url: `/uploads/${fileName}`, key: fileName };
}

export async function uploadFile(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  const fileName = `public/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.originalname || 'upload')}`;

  if (!supabase) {
    if (isServerlessRuntime) {
      throw new Error('Supabase Storage is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }

    return uploadLocally(file, fileName);
  }

  try {
    const { error } = await supabase.storage.from(bucketName).upload(fileName, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
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
  } catch (error) {
    if (isServerlessRuntime) {
      throw error;
    }

    console.warn('Supabase file storage is unavailable locally. Saving the upload under server/uploads instead.');
    return uploadLocally(file, fileName);
  }
}

export async function getUsers() {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured.');
  }

  const { data, error } = await supabase.storage.from(bucketName).download(usersFileName);
  if (error) {
    if (error.message?.includes('not found') || error.statusCode === 404) {
      return [];
    }
    throw error;
  }

  const parsed = JSON.parse(await data.text());
  return Array.isArray(parsed.users) ? parsed.users : [];
}

export async function setUsers(users) {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured.');
  }

  const { error } = await supabase.storage.from(bucketName).upload(
    usersFileName,
    Buffer.from(JSON.stringify({ users })),
    { contentType: 'application/json', upsert: true },
  );

  if (error) {
    throw error;
  }
}