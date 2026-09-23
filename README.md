# YouTube Transcript via GitHub Actions

GitHub + YouTube only.

## Flow

ChatGPT -> GitHub issue request -> GitHub Action -> YouTube -> temporary transcript artifact -> ChatGPT.

Only the 11-character video ID is used in the request. The full YouTube URL is not required.

## Trigger

Create an issue titled:

```
[transcript] rSBazrcpC5o
```

The Action tries:

1. YouTube transcript via youtubei.js
2. youtube-transcript
3. direct caption track
4. YouTube.js audio download
5. yt-dlp audio download + local Whisper transcription

The produced `transcript.txt` and `transcript.json` artifacts are retained for 1 day.

## Videos without captions

GitHub-hosted runners are sometimes challenged by YouTube with "Sign in to confirm you're not a bot" when downloading audio.

For those videos, add a repository Actions secret named:

```
YOUTUBE_COOKIES_B64
```

Its value should be a base64-encoded Netscape-format YouTube cookies file. Do not commit cookies to the repository.

The workflow writes the cookie file only for the job, then deletes it.

## Development

```bash
npm install
npm test
npm run typecheck
VIDEO_ID=rSBazrcpC5o npm run extract
```
