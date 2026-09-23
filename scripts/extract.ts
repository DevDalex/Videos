import { writeFile } from 'node:fs/promises';
import { getTranscript } from '../src/services/transcript.js';
import { extractVideoId, normalizeLanguage } from '../src/utils/youtube.js';

const raw = process.env.VIDEO_ID ?? '';
const language = normalizeLanguage(process.env.LANG);
const videoId = extractVideoId(raw);

if (!videoId) {
  throw new Error('VIDEO_ID must be a valid 11-character YouTube video ID.');
}

const result = await getTranscript(videoId, { language });

await writeFile(
  'transcript.json',
  JSON.stringify({ ok: true, ...result }, null, 2),
  'utf8'
);

await writeFile('transcript.txt', result.text + '\n', 'utf8');

console.log(
  JSON.stringify({
    ok: true,
    videoId,
    source: result.source,
    language: result.language,
    segments: result.segments.length,
    characters: result.text.length
  })
);
