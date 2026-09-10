import { UTApi } from 'uploadthing/server';

export const hasUploadThingStorage = Boolean(process.env.UPLOADTHING_TOKEN);
const uploadThing = hasUploadThingStorage ? new UTApi({ token: process.env.UPLOADTHING_TOKEN }) : null;

export async function uploadFile(file) {
  if (!uploadThing) {
    throw new Error('UploadThing is not configured. Add UPLOADTHING_TOKEN.');
  }

  const upload = await uploadThing.uploadFiles(new File([file.buffer], file.originalname, {
    type: file.mimetype || 'application/octet-stream',
  }));
  const result = upload?.data || upload;
  const url = result?.ufsUrl || result?.url;

  if (!url || !result?.key) {
    throw new Error('UploadThing returned an invalid upload response.');
  }

  return { ...result, url };
}
