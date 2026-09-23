import assert from 'node:assert/strict';
import test from 'node:test';
import { extractVideoId, normalizeLanguage } from '../src/utils/youtube.js';

const id = 'rSBazrcpC5o';

test('standard URL', () => {
  assert.equal(extractVideoId('https://www.youtube.com/watch?v=' + id), id);
});

test('youtu.be URL', () => {
  assert.equal(extractVideoId('https://youtu.be/' + id + '?si=abc'), id);
});

test('shorts and live URLs', () => {
  assert.equal(extractVideoId('https://youtube.com/shorts/' + id), id);
  assert.equal(extractVideoId('https://youtube.com/live/' + id), id);
});

test('raw video ID', () => {
  assert.equal(extractVideoId(id), id);
});

test('reject unrelated host', () => {
  assert.equal(extractVideoId('https://example.com/watch?v=' + id), null);
});

test('language validation', () => {
  assert.equal(normalizeLanguage('en'), 'en');
  assert.equal(normalizeLanguage('ar-KW'), 'ar-KW');
  assert.equal(normalizeLanguage('../etc/passwd'), undefined);
});
