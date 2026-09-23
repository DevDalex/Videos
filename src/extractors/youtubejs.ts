import { Innertube } from 'youtubei.js';
import type {
  ExtractOptions,
  TranscriptExtractor,
  TranscriptResult,
  TranscriptSegment
} from '../types.js';
import { cleanCaptionText, joinTranscript } from '../utils/text.js';

let youtubePromise: Promise<Innertube> | undefined;

function getYoutube(): Promise<Innertube> {
  youtubePromise ??= Innertube.create();
  return youtubePromise;
}

export class YoutubeJsExtractor implements TranscriptExtractor {
  readonly name = 'youtubei.js' as const;

  async extract(
    videoId: string,
    options: ExtractOptions = {}
  ): Promise<TranscriptResult> {
    const youtube = await getYoutube();
    const info = await youtube.getInfo(videoId);
    let transcript: any = await info.getTranscript();

    if (options.language && typeof transcript?.selectLanguage === 'function') {
      const available = Array.isArray(transcript?.languages)
        ? transcript.languages
        : [];

      const requested = options.language.toLowerCase();
      const matched = available.find((language: unknown) => {
        const value =
          typeof language === 'string'
            ? language
            : String((language as any)?.language_code ?? (language as any)?.code ?? '');
        return value.toLowerCase() === requested;
      });

      if (matched) {
        transcript = await transcript.selectLanguage(
          typeof matched === 'string'
            ? matched
            : (matched as any)?.language_code ?? (matched as any)?.code
        );
      }
    }

    const rawSegments =
      transcript?.transcript?.content?.body?.initial_segments ?? [];

    const segments: TranscriptSegment[] = (rawSegments as any[])
      .map((segment) => {
        const startMs = Number(segment?.start_ms ?? 0);
        const endMs = Number(segment?.end_ms ?? startMs);
        const text = cleanCaptionText(segment?.snippet?.text);

        return {
          startMs,
          endMs,
          durationMs: Math.max(0, endMs - startMs),
          text
        };
      })
      .filter((segment) => segment.text);

    if (!segments.length) {
      throw new Error('YouTube.js returned no transcript segments.');
    }

    const selectedLanguage =
      transcript?.selected_language?.language_code ??
      transcript?.selectedLanguage ??
      null;

    return {
      videoId,
      title: info?.basic_info?.title ?? null,
      language: typeof selectedLanguage === 'string' ? selectedLanguage : null,
      generated: null,
      source: this.name,
      segments,
      text: joinTranscript(segments)
    };
  }
}
