import type {
  ExtractOptions,
  TranscriptExtractor,
  TranscriptResult
} from '../types.js';
import { WatchPageExtractor } from '../extractors/watch-page.js';
import { YoutubeJsExtractor } from '../extractors/youtubejs.js';
import { YoutubeTranscriptExtractor } from '../extractors/youtube-transcript.js';

export class TranscriptUnavailableError extends Error {
  readonly attempts: Array<{ source: string; message: string }>;

  constructor(attempts: Array<{ source: string; message: string }>) {
    super('Transcript could not be retrieved.');
    this.name = 'TranscriptUnavailableError';
    this.attempts = attempts;
  }
}

const extractors: TranscriptExtractor[] = [
  new YoutubeJsExtractor(),
  new YoutubeTranscriptExtractor(),
  new WatchPageExtractor()
];

async function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(label + ' timed out after ' + timeoutMs + 'ms.')),
          timeoutMs
        );
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function getTranscript(
  videoId: string,
  options: ExtractOptions = {}
): Promise<TranscriptResult> {
  const attempts: Array<{ source: string; message: string }> = [];

  for (const extractor of extractors) {
    try {
      return await withTimeout(
        extractor.extract(videoId, options),
        12_000,
        extractor.name
      );
    } catch (error) {
      attempts.push({
        source: extractor.name,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  throw new TranscriptUnavailableError(attempts);
}
