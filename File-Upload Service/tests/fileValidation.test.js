import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUpload, buildShareUrl, isExpired } from '../src/lib/fileValidation.js';

test('allows supported image and PDF files up to 50MB', () => {
  const file = {
    originalname: 'photo.png',
    size: 2 * 1024 * 1024,
    mimetype: 'image/png',
  };

  assert.deepEqual(validateUpload(file), { valid: true });
});

test('rejects unsupported files and oversized uploads', () => {
  const unsupported = {
    originalname: 'notes.txt',
    size: 2 * 1024 * 1024,
    mimetype: 'text/plain',
  };

  const oversized = {
    originalname: 'large.pdf',
    size: 60 * 1024 * 1024,
    mimetype: 'application/pdf',
  };

  assert.deepEqual(validateUpload(unsupported), {
    valid: false,
    error: 'Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF.',
  });

  assert.deepEqual(validateUpload(oversized), {
    valid: false,
    error: 'File size exceeds 50MB limit.',
  });
});

test('accepts supported files with a generic browser mime type', () => {
  const file = {
    originalname: 'photo.jpg',
    size: 2 * 1024 * 1024,
    mimetype: 'application/octet-stream',
  };

  assert.deepEqual(validateUpload(file), { valid: true });
});

test('builds a shareable URL and detects expired links', () => {
  const shareUrl = buildShareUrl('https://example.com', 'abc123');
  assert.equal(shareUrl, 'https://example.com/share/abc123');
  assert.equal(isExpired(new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)), true);
  assert.equal(isExpired(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), false);
});
