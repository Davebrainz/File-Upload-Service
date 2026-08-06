const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
const maxFileSize = 50 * 1024 * 1024;

export function validateUpload(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const fileName = (file.originalname || file.name || '').toLowerCase();
  const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
  const mimeType = (file.mimetype || file.type || '').toLowerCase();
  const hasAllowedExtension = allowedExtensions.has(extension);
  const hasAllowedMime = allowedMimeTypes.has(mimeType);
  const isGenericMime = mimeType === '' || mimeType === 'application/octet-stream';
  const isImageLikeMime = mimeType.startsWith('image/');

  if (!hasAllowedExtension) {
    return { valid: false, error: 'Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF.' };
  }

  if (!hasAllowedMime && !isGenericMime && !isImageLikeMime) {
    return { valid: false, error: 'Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF.' };
  }

  if (file.size > maxFileSize) {
    return { valid: false, error: 'File size exceeds 50MB limit.' };
  }

  return { valid: true };
}

export function buildShareUrl(baseUrl, id) {
  return `${baseUrl.replace(/\/$/, '')}/share/${id}`;
}

export function isExpired(expiresAt) {
  return new Date(expiresAt) <= new Date();
}
