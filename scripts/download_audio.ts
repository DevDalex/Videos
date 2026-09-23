import { createWriteStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Innertube } from 'youtubei.js';
import { extractVideoId } from '../src/utils/youtube.js';

const raw = process.env.VIDEO_ID ?? '';
const videoId = extractVideoId(raw);

if (!videoId) {
  throw new Error('VIDEO_ID must be a valid YouTube video ID.');
}

const youtube = await Innertube.create();
const info = await youtube.getBasicInfo(videoId);
const title = info?.basic_info?.title ?? null;

const stream = await youtube.download(videoId, {
  type: 'audio',
  quality: 'best'
});

const output = 'audio.media';
const nodeStream = Readable.fromWeb(stream as any);

await pipeline(nodeStream, createWriteStream(output));
await writeFile(
  'audio.info.json',
  JSON.stringify({ videoId, title }, null, 2),
  'utf8'
);

console.log(JSON.stringify({ ok: true, videoId, title, output }));
