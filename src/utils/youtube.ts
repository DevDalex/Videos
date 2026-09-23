const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function extractVideoId(input: string): string | null {
  const value = input.trim();

  if (VIDEO_ID.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0] ?? '';
      return VIDEO_ID.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const queryId = url.searchParams.get('v') ?? '';
      if (VIDEO_ID.test(queryId)) return queryId;

      const parts = url.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'live'].includes(parts[0] ?? '')) {
        const id = parts[1] ?? '';
        return VIDEO_ID.test(id) ? id : null;
      }
    }
  } catch {
    // Fall through to the conservative pattern below.
  }

  const match = value.match(
    /(?:youtu\.be\/|youtube\.com\/(?:shorts|embed|live)\/|[?&]v=)([A-Za-z0-9_-]{11})(?:[^A-Za-z0-9_-]|$)/
  );

  return match?.[1] ?? null;
}

export function normalizeLanguage(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const value = input.trim();
  if (!value) return undefined;
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(value)) return undefined;
  return value;
}
