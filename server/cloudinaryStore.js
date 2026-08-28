import { v2 as cloudinary } from 'cloudinary';

const usersPublicId = 'file-upload-service/users.json';

export const hasCloudinaryStorage = Boolean(process.env.CLOUDINARY_URL || (
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
));

if (hasCloudinaryStorage && !process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
    stream.end(buffer);
  });
}

export function uploadFile(file) {
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const publicId = `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
  return uploadBuffer(file.buffer, {
    public_id: publicId,
    resource_type: 'auto',
    type: 'upload',
    overwrite: false,
  });
}

export async function getUsers() {
  try {
    await cloudinary.api.resource(usersPublicId, { resource_type: 'raw', type: 'authenticated' });
    const secureUrl = cloudinary.url(usersPublicId, {
      resource_type: 'raw',
      type: 'authenticated',
      secure: true,
      sign_url: true,
    });
    const response = await fetch(secureUrl);
    if (!response.ok) {
      throw new Error(`Cloudinary user asset returned ${response.status}.`);
    }
    const data = await response.json();
    return Array.isArray(data.users) ? data.users : [];
  } catch (error) {
    if (error.error?.http_code === 404 || error.http_code === 404) {
      return [];
    }
    throw error;
  }
}

export function setUsers(users) {
  return uploadBuffer(Buffer.from(JSON.stringify({ users })), {
    public_id: usersPublicId,
    resource_type: 'raw',
    type: 'authenticated',
    overwrite: true,
    invalidate: true,
  });
}