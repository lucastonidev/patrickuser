# ☕ PatrickUser (The Mentalist OSINT Hunter)

> *"Sherlock looked for physical clues. Patrick Jane reads what people leave behind in plain sight."*  
> **The turbocharged Sherlock successor for observational OSINT in 100% native JavaScript (Node.js ESM).**

[🇧🇷 Português](README.md) | [🇺🇸 English](README.en.md) | [🇪🇸 Español](README.es.md)

[![Node Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Native)-blue?style=flat-square)](package.json)
[![Zero Build Step](https://img.shields.io/badge/Build%20Step-Zero%20(Instant%20Run)-orange?style=flat-square)](bin/patrickuser.js)
[![Tests Passing](https://img.shields.io/badge/Tests-18%2F18%20Passed-brightgreen?style=flat-square)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

```
                       ███████    ██
                      ████████████████    ██
                             ████████████████  ██
                                         ████████  █
                                               ████████
                               ███                  ██████
                           ████████                     ████
                       ███████                            ████
                    ██████                                  ████
                  █████                                       ███
                █████                                          ███
               ████                                              ██
              ███                             ██████             ███
             ████            ███           ███████████            ██
            ████         █████████                ███ █            █
           ████         ███                         █              █
           ████         █                           █              █
           ████         █                           █              █
           ████         █                           █             ██
            ████        █                           █            ██
            █████       █                       █████           ███
              ████      █    ████           ██████             ██
               ████     █     ████████████████               ███
                 ████         █     █    ███               ███
                   ██████     █     █                  ████
                     ██████         █              █████
                        ████████    █       ████████
                            ██████████████████
                             █
                             █
                                                  █
                                                  █

    ____        __       _      __                             
   / __ \____ _/ /______(_)____/ /____  ______  _____ ____ _____
  / /_/ / __ `/ __/ ___/ / ___/ //_/ / / / __ \/ ___// __ `/ __ \
 / ____/ /_/ / /_/ /  / / /__/ ,< / /_/ / /_/ / /   / /_/ / /_/ /
/_/    \__,_/\__/_/  /_/\___/_/|_|\__,_/\____/_/    \__,_/ .___/ 
  ~ The Mentalist OSINT Username Hunter (Sherlock Successor) ~ /_/
```

Inspired by the sharp, analytical, and observational mind of **Patrick Jane** from *The Mentalist*, **`patrickuser`** is a high-performance OSINT tool built to hunt down the digital footprint of any `@username` across 80+ global, gaming, and regional platforms. **It doesn't just check if a URL returns 200 OK**—it observes and extracts **rich metadata**: real names, high-definition avatars, bios, follower counts, karma, chess ratings, streaks, and public activity.

---

## ⚡ Why PatrickUser Outperforms Sherlock

| Feature | 🔍 Original Sherlock (Python) | ☕ PatrickUser (The Mentalist) |
| :--- | :--- | :--- |
| **Language & Runtime** | Python 3 (requires `pip`, `venv`, C compilers) | **100% Modern JavaScript (Node.js ESM)** |
| **Installation / Build** | Heavy install, version conflicts | **Zero Build Step** (`npx patrickuser target`) |
| **External Dependencies** | Multiple (`requests`, `tor`, etc.) | **Zero runtime dependencies (Native `fetch`)** |
| **Startup Latency** | ~800ms to 2.5s | **< 20ms** |
| **Metadata Extraction** | Profile link only | **Real Name, Bio, HD Avatar, Followers, Streaks, Ratings** |
| **Specialized Adapters** | Rare / fragile | **TikTok (oEmbed), GitHub, Reddit, Steam, Roblox, Minecraft, Lichess, Chess.com, Speedrun, Duolingo, Bluesky, 500px, Apoia.se, Mixcloud, Dailymotion, Freelancer, Archive.org, Threads, AniList, TabNews** |
| **Gaming & Pop Culture** | Very basic / prone to 404s | **Roblox (Official API), Minecraft (NameMC/Mojang), Steam (XML), Lichess, Chess.com, Speedrun.com, GOG.com, Itch.io, AniList, MyAnimeList** |
| **Micro-API & SSE Server** | None (requires wrappers) | **Built-in HTTP server with real-time SSE stream & Web GUI** |
| **Library Import** | Complex in Node | `import { huntUsername } from 'patrickuser'` |

---

## 🚀 Quick Start

Run **instantaneously** with `npx` (no installation needed):

```bash
# Direct execution via npx
npx patrickuser target_username

# Or install globally
npm install -g patrickuser
patrickuser target_username
```

Or clone and run natively with Node.js:

```bash
git clone https://github.com/patrickuser/patrickuser.git
cd patrickuser

# Run CLI
node bin/patrickuser.js torvalds
```

---

## 💻 CLI Usage & Examples

### 1. General Investigation
```bash
node bin/patrickuser.js john_doe
```

### 2. Filter by Category
Supported categories: `tech`, `social`, `gaming`, `content`, `brasil`, `professional`, `community`.
```bash
node bin/patrickuser.js notch --category gaming
```

### 3. Targeted Platforms
```bash
node bin/patrickuser.js alice --site github,reddit,tiktok,steam,minecraft
```

### 4. Concurrency & Timeout Control
```bash
node bin/patrickuser.js target --concurrency 30 --timeout 5000
```

### 5. Export Reports (JSON, CSV, Markdown)
```bash
# Generate Markdown report
node bin/patrickuser.js target -o investigation.md

# Generate CSV spreadsheet
node bin/patrickuser.js target -o results.csv

# Output structured JSON to stdout
node bin/patrickuser.js target --json > output.json
```

---

## 🌐 Micro-API Server & Real-Time SSE Stream with Web Dashboard

`patrickuser` includes a zero-dependency native HTTP server offering an interactive web interface and **Server-Sent Events (SSE)** streaming endpoints ready for frontend integration:

```bash
node bin/patrickuser.js --server -p 3000
```

Open in your browser:
- 🖥️ **Web Dashboard:** `http://localhost:3000/`
- 📡 **SSE Event Stream:** `http://localhost:3000/api/hunt?username=target`
- 📋 **Sites Directory:** `http://localhost:3000/api/sites`

### Consuming the SSE Stream in Frontend (React, Vue, Vanilla JS):
```javascript
const eventSource = new EventSource('http://localhost:3000/api/hunt?username=lucas');

// Emitted immediately when a profile is confirmed with metadata
eventSource.addEventListener('hit', (e) => {
  const result = JSON.parse(e.data);
  console.log(`[+] Confirmed on ${result.site}:`, result.metadata);
});

// Emitted on each platform checked
eventSource.addEventListener('progress', (e) => {
  const stats = JSON.parse(e.data);
  console.log(`Progress: ${stats.percent}% (${stats.checked}/${stats.total})`);
});

// Emitted when the investigation finishes
eventSource.addEventListener('done', (e) => {
  const summary = JSON.parse(e.data);
  console.log('Investigation finished:', summary);
  eventSource.close();
});
```

---

## 📦 Using as an NPM Library

```javascript
import { huntUsername, checkSite, getSites } from 'patrickuser';

const investigation = await huntUsername('torvalds', {
  concurrency: 25,
  categories: ['tech', 'gaming'],
  onFound: (hit) => {
    console.log(`[+] Footprint found: ${hit.site} -> ${hit.url}`);
    if (hit.metadata?.name) console.log(`    Name: ${hit.metadata.name}`);
    if (hit.metadata?.avatarUrl) console.log(`    Avatar: ${hit.metadata.avatarUrl}`);
  },
  onChecked: (res, stats) => {
    console.log(`Progress: ${stats.percent}%`);
  }
});

console.log(`Total found: ${investigation.found} footprints in ${investigation.durationMs}ms`);
```

---

## 🧩 Adding a New Platform in 30 Seconds

Simply add an entry to `data/sites.json`:

```json
{
  "name": "NewPlatform",
  "url": "https://newplatform.com/{}",
  "category": "social",
  "errorType": "status_code",
  "errorCode": 404,
  "regexCheck": "^[a-zA-Z0-9_]{3,20}$"
}
```

Or, if the platform requires custom headers, GraphQL, or JSON APIs, create an adapter in `src/adapters/newplatform.js` and register it in `src/adapters/index.js`.

---

## 🧪 Automated Tests

The project uses Node.js's native test runner (`node:test`):

```bash
npm test
```

Test coverage includes:
- Metadata extraction (OpenGraph, Twitter Cards, JSON-LD schemas).
- Regex validation and sanitization per platform.
- Specialized adapters registry and execution.
- Exporters (JSON, CSV, Markdown).
- Native HTTP micro-server and SSE streaming.

---

## 📜 License

Distributed under the **MIT** License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <i>"Tyger Tyger, burning bright... In OSINT, observe what others overlook." — PatrickUser Team</i>
</p>
