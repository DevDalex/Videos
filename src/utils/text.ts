const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
  nbsp: ' '
};

export function decodeEntities(value: string): string {
  return value
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, entity: string) => {
      if (entity[0] === '#') {
        const hex = entity[1]?.toLowerCase() === 'x';
        const raw = entity.slice(hex ? 2 : 1);
        const code = Number.parseInt(raw, hex ? 16 : 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : full;
      }

      return NAMED_ENTITIES[entity.toLowerCase()] ?? full;
    })
    .replace(/\u200b/g, '');
}

export function cleanCaptionText(value: unknown): string {
  const raw =
    typeof value === 'string'
      ? value
      : value && typeof (value as { toString?: () => string }).toString === 'function'
        ? String(value)
        : '';

  return decodeEntities(raw)
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function joinTranscript(segments: { text: string }[]): string {
  return segments
    .map((segment) => segment.text)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
