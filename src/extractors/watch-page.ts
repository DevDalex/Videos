import type {
  ExtractOptions,
  TranscriptExtractor,
  TranscriptResult,
  TranscriptSegment
} from '../types.js';
import { cleanCaptionText, decodeEntities, joinTranscript } from '../utils/text.js';

type CaptionTrack = {
  baseUrl?: string;
  languageCode?: string;
  kind?: string;
};

function extractJsonArray(source: string, key: string): unknown[] | null {
  const marker = '"' + key + '":';
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return null;

  const start = source.indexOf('[', markerIndex + marker.length);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;

    if (depth === 0) {
      try {
        return JSON.parse(source.slice(start, index + 1));
      } catch {
        return null;
      }
    }
  }

  return null;
}

function chooseTrack(
  tracks: CaptionTrack[],
  requestedLanguage?: string
): CaptionTrack | null {
  if (!tracks.length) return null;

  if (requestedLanguage) {
    const requested = requestedLanguage.toLowerCase();
    const exact = tracks.find(
      (track) => track.languageCode?.toLowerCase() === requested
    );
    if (exact) return exact;

    const prefix = requested.split('-')[0];
    const related = tracks.find(
      (track) => track.languageCode?.toLowerCase().split('-')[0] === prefix
    );
    if (related) return related;
  }

  return tracks.find((track) => track.kind !== 'asr') ?? tracks[0] ?? null;
}

function pageTitle(html: string): string | null {
  const match =
    html.match(/<meta\s+name="title"\s+content="([^"]+)"/i) ??
    html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);

  return match?.[1] ? decodeEntities(match[1]) : null;
}

export class WatchPageExtractor implements TranscriptExtractor {
  readonly name = 'watch-page' as const;

  async extract(
    videoId: string,
    options: ExtractOptions = {}
  ): Promise<TranscriptResult> {
    const page = await fetch(
      'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId) + '&hl=en',
      {
        headers: {
          'accept-language': 'en-US,en;q=0.9',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36'
        },
        signal: AbortSignal.timeout(10_000)
      }
    );

    if (!page.ok) {
      throw new Error('YouTube watch page returned HTTP ' + page.status + '.');
    }

    const html = await page.text();
    const parsed = extractJsonArray(html, 'captionTracks');
    const tracks = Array.isArray(parsed) ? (parsed as CaptionTrack[]) : [];
    const track = chooseTrack(tracks, options.language);

    if (!track?.baseUrl) {
      throw new Error('No caption track was found on the watch page.');
    }

    const captionUrl = new URL(track.baseUrl);
    captionUrl.searchParams.set('fmt', 'json3');

    const captions = await fetch(captionUrl, {
      signal: AbortSignal.timeout(10_000)
    });

    if (!captions.ok) {
      throw new Error('Caption track returned HTTP ' + captions.status + '.');
    }

    const payload: any = await captions.json();
    const events = Array.isArray(payload?.events) ? payload.events : [];

    const segments: TranscriptSegment[] = events
      .filter((event: any) => Array.isArray(event?.segs))
      .map((event: any) => {
        const startMs = Number(event?.tStartMs ?? 0);
        const durationMs = Math.max(0, Number(event?.dDurationMs ?? 0));
        const text = cleanCaptionText(
          event.segs.map((segment: any) => segment?.utf8 ?? '').join('')
        );

        return {
          startMs,
          endMs: startMs + durationMs,
          durationMs,
          text
        };
      })
      .filter((segment: TranscriptSegment) => segment.text);

    if (!segments.length) {
      throw new Error('Caption track contained no transcript segments.');
    }

    return {
      videoId,
      title: pageTitle(html),
      language: track.languageCode ?? options.language ?? null,
      generated: track.kind === 'asr',
      source: this.name,
      segments,
      text: joinTranscript(segments)
    };
  }
}
