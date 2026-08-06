import test from 'node:test';
import assert from 'node:assert/strict';
import { getShareResponse } from '../server/shareResponse.js';

test('returns inline headers for JPEG files', () => {
  const response = getShareResponse('/tmp/example.jpeg');

  assert.equal(response.contentType, 'image/jpeg');
  assert.match(response.contentDisposition, /^inline/);
});

test('returns inline headers for PDF files', () => {
  const response = getShareResponse('/tmp/example.pdf');

  assert.equal(response.contentType, 'application/pdf');
  assert.match(response.contentDisposition, /^inline/);
});
