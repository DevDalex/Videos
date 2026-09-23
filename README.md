# YouTube Transcript via GitHub Actions

This repository uses GitHub Actions to fetch a YouTube transcript. No Vercel, web server, or external application layer is required.

## Flow

ChatGPT -> GitHub issue request -> GitHub Action -> YouTube -> temporary Actions artifact -> ChatGPT.

The request stores only the 11-character YouTube video ID, not the full YouTube URL.

## Trigger

Create an issue with this exact title format:

```
[transcript] rSBazrcpC5o
```

The workflow validates the ID, runs the extractor chain, then uploads:

- `transcript.txt`
- `transcript.json`

Artifacts are retained for **1 day**.

## Extractor chain

1. youtubei.js
2. youtube-transcript
3. direct YouTube watch-page caption track

## Development

```bash
npm install
npm test
npm run typecheck
VIDEO_ID=rSBazrcpC5o npm run extract
```

## Notes

The repository does not contain a database or transcript archive. GitHub itself keeps normal repository, issue, Actions, and artifact metadata according to GitHub's platform behavior.
