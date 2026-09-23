import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getTranscript, TranscriptUnavailableError } from './src/services/transcript.js';
import { extractVideoId, normalizeLanguage } from './src/utils/youtube.js';

const app = new Hono();

app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type']
  })
);

app.use('/api/*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store, max-age=0');
  c.header('Pragma', 'no-cache');
});

async function respond(
  c: any,
  raw: string,
  language?: string
) {
  if (!raw) {
    return c.json(
      {
        ok: false,
        error: 'Provide a YouTube URL or video ID.'
      },
      400
    );
  }

  const videoId = extractVideoId(raw);

  if (!videoId) {
    return c.json(
      {
        ok: false,
        error: 'Invalid YouTube URL or video ID.'
      },
      400
    );
  }

  try {
    const result = await getTranscript(videoId, { language });
    return c.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof TranscriptUnavailableError) {
      return c.json(
        {
          ok: false,
          videoId,
          error: error.message,
          attempts: error.attempts
        },
        502
      );
    }

    return c.json(
      {
        ok: false,
        videoId,
        error: error instanceof Error ? error.message : 'Unknown error.'
      },
      500
    );
  }
}

app.get('/api', (c) => {
  const raw = c.req.query('id') ?? c.req.query('url') ?? '';
  const language = normalizeLanguage(c.req.query('lang'));
  return respond(c, raw, language);
});

app.post('/api', async (c) => {
  let body: Record<string, unknown>;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: 'Body must be valid JSON.' }, 400);
  }

  const raw =
    typeof body.id === 'string'
      ? body.id
      : typeof body.url === 'string'
        ? body.url
        : '';

  return respond(c, raw, normalizeLanguage(body.lang));
});

app.get('/', (c) =>
  c.html(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>YouTube Transcript Bridge</title>
<style>
:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif}
body{margin:0;background:#0b0d10;color:#f4f7fb}
main{width:min(900px,calc(100% - 32px));margin:56px auto}
h1{margin-bottom:8px}p{color:#a9b2c0}
form{display:grid;grid-template-columns:1fr auto;gap:10px;margin:24px 0}
input,button{font:inherit;border-radius:12px;padding:13px 14px}
input{border:1px solid #303640;background:#15181d;color:inherit}
button{border:0;font-weight:700;cursor:pointer}
pre{min-height:220px;white-space:pre-wrap;word-break:break-word;background:#15181d;border:1px solid #252b33;border-radius:14px;padding:18px;line-height:1.55}
#meta{font-size:14px;color:#a9b2c0}
@media(max-width:640px){form{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<h1>YouTube Transcript Bridge</h1>
<p>Paste a YouTube URL. The application intentionally keeps no transcript history.</p>
<form id="form">
<input id="url" placeholder="https://www.youtube.com/watch?v=..." required>
<button>Get transcript</button>
</form>
<div id="meta"></div>
<pre id="output">Ready.</pre>
</main>
<script>
const form=document.getElementById('form');
const input=document.getElementById('url');
const meta=document.getElementById('meta');
const output=document.getElementById('output');
form.addEventListener('submit',async(e)=>{
 e.preventDefault(); meta.textContent=''; output.textContent='Loading...';
 try{
  const r=await fetch('/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:input.value})});
  const d=await r.json();
  if(!r.ok||!d.ok) throw new Error(d.error||'Request failed');
  meta.textContent=[d.title,d.language,d.generated===true?'auto captions':d.generated===false?'manual captions':null,d.source].filter(Boolean).join(' · ');
  output.textContent=d.text||'(empty transcript)';
 }catch(err){output.textContent=err instanceof Error?err.message:String(err)}
});
</script>
</body>
</html>`)
);

export default app;
