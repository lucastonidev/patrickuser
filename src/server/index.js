/**
 * @file server/index.js - Native HTTP Micro-API with Server-Sent Events (SSE) Streaming
 */
import http from 'node:http';
import { URL } from 'node:url';
import { huntUsername, getSites, getCategories } from '../core/engine.js';
import { c } from '../cli/colors.js';

/**
 * Embedded Mentalist Web GUI Dashboard
 * @returns {string} HTML string
 */
function getEmbeddedHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PatrickUser · The Mentalist OSINT Hunter</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: #161b22;
      --border: #30363d;
      --gold: #f59e0b;
      --amber: #fbbf24;
      --neon: #10b981;
      --cyan: #06b6d4;
      --text: #f3f4f6;
      --text-dim: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 2rem 1rem; }
    .container { max-width: 900px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 2rem; }
    h1 { font-size: 2.2rem; color: var(--gold); letter-spacing: -0.5px; }
    .tagline { color: var(--text-dim); margin-top: 0.5rem; font-style: italic; }
    .search-box { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    input[type="text"] {
      flex: 1; padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid var(--border);
      background: var(--card-bg); color: #fff; font-size: 1rem; outline: none;
    }
    input[type="text"]:focus { border-color: var(--gold); }
    button {
      padding: 0.8rem 1.6rem; background: var(--gold); color: #000; border: none;
      border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;
    }
    button:hover { background: var(--amber); }
    .status-bar {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--card-bg); padding: 0.8rem 1.2rem; border-radius: 8px;
      border: 1px solid var(--border); margin-bottom: 1.5rem;
    }
    .hits-badge { background: #065f46; color: #a7f3d0; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: bold; }
    .progress-bar-bg { width: 100%; height: 6px; background: #21262d; border-radius: 3px; overflow: hidden; margin-top: 0.8rem; }
    .progress-bar-fill { width: 0%; height: 100%; background: var(--gold); transition: width 0.2s; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .card {
      background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px;
      padding: 1rem; display: flex; gap: 1rem; transition: transform 0.15s, border-color 0.15s;
    }
    .card:hover { transform: translateY(-2px); border-color: var(--gold); }
    .avatar { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; background: #21262d; border: 1px solid var(--border); }
    .card-info { flex: 1; min-width: 0; }
    .card-header { display: flex; justify-content: space-between; align-items: baseline; }
    .site-name { font-weight: bold; color: #fff; text-decoration: none; }
    .site-name:hover { text-decoration: underline; color: var(--cyan); }
    .category-tag { font-size: 0.75rem; color: var(--cyan); text-transform: uppercase; }
    .user-name { font-size: 0.9rem; color: var(--amber); margin-top: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bio { font-size: 0.8rem; color: var(--text-dim); margin-top: 0.3rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .extra-tag { display: inline-block; font-size: 0.75rem; background: #21262d; color: var(--gold); padding: 0.1rem 0.4rem; border-radius: 4px; margin-top: 0.4rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div style="font-family: monospace; white-space: pre; color: #ef4444; font-size: 0.95rem; line-height: 1.15; margin-bottom: 0.8rem; font-weight: bold;">
          . ── ~ ~ ~ ── .
      . '   \\       /   ' .
    /       ●     ●       \\
   :                         :
   :      \\             /    :
    \\       ' ─ . . ─ '     /
      ' .                 . '
          ' ── ~ ~ ~ ── '
      </div>
      <h1>☕ PatrickUser</h1>
      <p class="tagline">"Tyger Tyger, burning bright... Sherlock looked for physical clues. Patrick Jane reads what people leave behind."</p>
    </header>

    <div class="search-box">
      <input type="text" id="usernameInput" placeholder="Enter target username (e.g. lucas, torvalds)..." autofocus />
      <button id="searchBtn" onclick="startHunt()">Observe Target</button>
    </div>

    <div class="status-bar" id="statusBar" style="display: none;">
      <div>
        <span id="statusText">Observing digital footprints...</span>
        <div class="progress-bar-bg"><div class="progress-bar-fill" id="progressFill"></div></div>
      </div>
      <div>
        <span class="hits-badge" id="hitsCount">0 Footprints</span>
      </div>
    </div>

    <div class="grid" id="resultsGrid"></div>
  </div>

  <script>
    let evtSource = null;

    function startHunt() {
      const username = document.getElementById('usernameInput').value.trim();
      if (!username) return;

      if (evtSource) {
        evtSource.close();
      }

      const grid = document.getElementById('resultsGrid');
      grid.innerHTML = '';
      document.getElementById('statusBar').style.display = 'flex';
      document.getElementById('progressFill').style.width = '0%';
      document.getElementById('hitsCount').innerText = '0 Footprints';
      document.getElementById('statusText').innerText = 'Scanning platforms for @' + username + '...';

      let hits = 0;
      evtSource = new EventSource('/api/hunt?username=' + encodeURIComponent(username));

      evtSource.addEventListener('hit', (e) => {
        hits++;
        document.getElementById('hitsCount').innerText = hits + ' Footprints';
        const item = JSON.parse(e.data);
        const card = document.createElement('div');
        card.className = 'card';

        const avatarSrc = (item.metadata && item.metadata.avatarUrl) ? item.metadata.avatarUrl : 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(item.site);
        const name = (item.metadata && item.metadata.name) ? item.metadata.name : username;
        const bio = (item.metadata && item.metadata.bio) ? item.metadata.bio : '';

        let extraHtml = '';
        if (item.metadata && item.metadata.extra) {
          const ex = item.metadata.extra;
          if (ex.streak) extraHtml += '<span class="extra-tag">🔥 ' + ex.streak + ' streak</span> ';
          if (ex.totalKarma) extraHtml += '<span class="extra-tag">Karma: ' + ex.totalKarma + '</span> ';
          if (ex.publicRepos !== undefined) extraHtml += '<span class="extra-tag">Repos: ' + ex.publicRepos + '</span> ';
          if (ex.tabcoins) extraHtml += '<span class="extra-tag">TabCoins: ' + ex.tabcoins + '</span> ';
        }

        card.innerHTML = \`
          <img class="avatar" src="\${avatarSrc}" onerror="this.src='https://api.dicebear.com/7.x/identicon/svg?seed=\${encodeURIComponent(item.site)}'" />
          <div class="card-info">
            <div class="card-header">
              <a class="site-name" href="\${item.url}" target="_blank">\${item.site} ↗</a>
              <span class="category-tag">\${item.category}</span>
            </div>
            <div class="user-name">\${name}</div>
            \${bio ? '<div class="bio">' + bio + '</div>' : ''}
            <div>\${extraHtml}</div>
          </div>
        \`;
        grid.appendChild(card);
      });

      evtSource.addEventListener('progress', (e) => {
        const stats = JSON.parse(e.data);
        document.getElementById('progressFill').style.width = stats.percent + '%';
        document.getElementById('statusText').innerText = 'Investigating: ' + stats.checked + '/' + stats.total + ' (' + stats.percent + '%)';
      });

      evtSource.addEventListener('done', (e) => {
        const summary = JSON.parse(e.data);
        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('statusText').innerText = 'Completed in ' + (summary.durationMs / 1000).toFixed(2) + 's';
        evtSource.close();
      });

      evtSource.onerror = () => {
        document.getElementById('statusText').innerText = 'Investigation finalized.';
        evtSource.close();
      };
    }

    document.getElementById('usernameInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startHunt();
    });
  </script>
</body>
</html>`;
}

/**
 * Send SSE formatted event
 * @param {http.ServerResponse} res
 * @param {string} event
 * @param {any} data
 */
function sendSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Start the Micro-API Server with SSE support
 * @param {number} [port=3000]
 * @returns {http.Server}
 */
export function startServer(port = 3000) {
  const server = http.createServer(async (req, res) => {
    // Enable universal CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 1. Web UI Dashboard
    if (pathname === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getEmbeddedHtml());
      return;
    }

    // 2. Sites catalog endpoint
    if (pathname === '/api/sites' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getSites()));
      return;
    }

    // 3. Categories catalog endpoint
    if (pathname === '/api/categories' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getCategories()));
      return;
    }

    // 4. SSE Real-time Streaming Hunt
    if (pathname === '/api/hunt' && req.method === 'GET') {
      const username = parsedUrl.searchParams.get('username');
      if (!username) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing username parameter' }));
        return;
      }

      const catParam = parsedUrl.searchParams.get('category');
      const categories = catParam ? catParam.split(',').map((c) => c.trim()) : undefined;
      const concurrency = parseInt(parsedUrl.searchParams.get('concurrency') || '20', 10);
      const timeout = parseInt(parsedUrl.searchParams.get('timeout') || '10000', 10);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      sendSse(res, 'start', { username, timestamp: new Date().toISOString() });

      const abortController = new AbortController();
      req.on('close', () => {
        abortController.abort();
      });

      try {
        const result = await huntUsername(username, {
          concurrency,
          timeout,
          categories,
          signal: abortController.signal,
          onFound: (hit) => {
            sendSse(res, 'hit', hit);
          },
          onChecked: (hit, stats) => {
            sendSse(res, 'progress', stats);
          }
        });

        sendSse(res, 'done', {
          target: username,
          total: result.total,
          found: result.found,
          durationMs: result.durationMs
        });
        res.end();
      } catch (err) {
        sendSse(res, 'error', { message: err.message });
        res.end();
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(port, () => {
    console.log(`\n ${c.badgeGold('PATRICKUSER SERVER')} ${c.neonGreen('RUNNING')}`);
    console.log(` ${c.dim('Dashboard & Web GUI:')} ${c.underline(c.cyan(`http://localhost:${port}/`))}`);
    console.log(` ${c.dim('SSE Stream Endpoint:')}  ${c.underline(c.sky(`http://localhost:${port}/api/hunt?username=target`))}`);
    console.log(` ${c.dim('Sites Catalog:')}        ${c.underline(c.gray(`http://localhost:${port}/api/sites`))}\n`);
  });

  return server;
}

