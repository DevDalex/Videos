# YouTube Transcript Bridge

Stateless YouTube transcript service built with TypeScript + Hono for Vercel.

## Flow

Client -> POST /api -> extractor chain -> normalized transcript JSON.

Extractor order:

1. youtubei.js
2. youtube-transcript
3. direct watch-page caption-track fallback

## Privacy

The application has no database, no account system, no transcript history, no analytics code, and no application-level request logging. API responses use Cache-Control: no-store.

Hosting infrastructure can still keep platform-level logs according to the host's own settings. POST is preferred so the full YouTube URL is not placed in the query string.

## API

Preferred:

~~~http
POST /api
Content-Type: application/json

{"url":"https://www.youtube.com/watch?v=rSBazrcpC5o"}
~~~

Optional language:

~~~json
{"url":"https://www.youtube.com/watch?v=rSBazrcpC5o","lang":"en"}
~~~

GET is also supported:

~~~text
/api?id=rSBazrcpC5o
~~~

## Response

~~~json
{
  "ok": true,
  "videoId": "rSBazrcpC5o",
  "title": "...",
  "language": "en",
  "generated": true,
  "source": "watch-page",
  "segments": [
    {"startMs":0,"endMs":1200,"durationMs":1200,"text":"..."}
  ],
  "text": "..."
}
~~~

## Development

~~~bash
npm install
npm test
npm run typecheck
npm run dev
~~~

## Deploy

Import this repository into Vercel or deploy it with the Vercel CLI. Hono is supported natively by Vercel.

No API key or database is required.
