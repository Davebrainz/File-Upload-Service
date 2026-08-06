import path from 'path';

const mimeByExtension = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

export function getShareResponse(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeByExtension[extension] || 'application/octet-stream';

  return {
    contentType,
    contentDisposition: 'inline; filename="' + path.basename(filePath) + '"',
  };
}
