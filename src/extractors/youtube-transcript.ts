import { fetchTranscript } from 'youtube-transcript';
import type {
  ExtractOptions,
  TranscriptExtractor,
  TranscriptResult,
  TranscriptSegment
} from '../types.js';
import { cleanCaptionText, joinTranscript } from '../utils/text.js';

export class YoutubeTranscriptExtractor implements TranscriptExtractor {
  readonly name = 'youtube-transcript' as const;

  async extract(
    videoId: string,
    options: ExtractOptions = {}
  ): Promise<TranscriptResult> {
    const items = await fetchTranscript(
      videoId,
      options.language ? { lang: options.language } : undefined
    );

    const segments: TranscriptSegment[] = (items ?? [])
      .map((item: any) => {
        const startMs = Number(item?.offset ?? 0);
        const durationMs = Math.max(0, Number(item?.duration ?? 0));

        return {
          startMs,
          endMs: startMs + durationMs,
          durationMs,
          text: cleanCaptionText(item?.text)
        };
      })
      .filter((segment) => segment.text);

    if (!segments.length) {
      throw new Error('youtube-transcript returned no transcript segments.');
    }

    return {
      videoId,
      title: null,
      language: options.language ?? null,
      generated: null,
      source: this.name,
      segments,
      text: joinTranscript(segments)
    };
  }
}
