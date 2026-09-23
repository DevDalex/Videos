export type TranscriptSource =
  | 'youtubei.js'
  | 'youtube-transcript'
  | 'watch-page';

export type TranscriptSegment = {
  startMs: number;
  endMs: number;
  durationMs: number;
  text: string;
};

export type TranscriptResult = {
  videoId: string;
  title: string | null;
  language: string | null;
  generated: boolean | null;
  source: TranscriptSource;
  segments: TranscriptSegment[];
  text: string;
};

export type ExtractOptions = {
  language?: string;
};

export interface TranscriptExtractor {
  readonly name: TranscriptSource;
  extract(videoId: string, options?: ExtractOptions): Promise<TranscriptResult>;
}
