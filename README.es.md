# ☕ PatrickUser (The Mentalist OSINT Hunter)

> *"Sherlock buscaba huellas físicas. Patrick Jane lee lo que las personas dejan a plena vista."*  
> **El sucesor potenciado de Sherlock para investigación OSINT en JavaScript 100% nativo (Node.js ESM).**

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

Inspirado en la mente analítica, aguda y observadora de **Patrick Jane** de la serie *The Mentalist* (El Mentalista), **`patrickuser`** es una herramienta OSINT de alto rendimiento diseñada para rastrear la huella digital de cualquier `@username` en más de 80 plataformas globales, de videojuegos y regionales. **No se limita a verificar si una URL responde con un estado 200 OK** — observa y extrae **metadatos enriquecidos**: nombres reales, avatares en alta resolución, biografías, recuento de seguidores, karma, puntuaciones de ajedrez, rachas y actividad pública.

---

## ⚡ Por qué PatrickUser supera a Sherlock

| Característica | 🔍 Sherlock Original (Python) | ☕ PatrickUser (The Mentalist) |
| :--- | :--- | :--- |
| **Lenguaje y Entorno** | Python 3 (requiere `pip`, `venv`, compiladores C) | **JavaScript Moderno 100% Nativo (Node.js ESM)** |
| **Instalación y Compilación**| Instalación pesada, conflictos de dependencias | **Cero Pasos de Compilación** (`npx patrickuser target`) |
| **Dependencias Externas** | Múltiples (`requests`, `tor`, etc.) | **Cero dependencias de producción (`fetch` nativo)** |
| **Tiempo de Arranque** | ~800ms a 2.5s | **< 20ms** |
| **Extracción de Metadatos**| Solo enlaces de perfil | **Nombre Real, Biografía, Avatar HD, Seguidores, Rachas, Ratings** |
| **Adaptadores Especializados**| Raros o frágiles | **TikTok (oEmbed), GitHub, Reddit, Steam, Roblox, Minecraft, Lichess, Chess.com, Speedrun, Duolingo, Bluesky, 500px, Apoia.se, Mixcloud, Dailymotion, Freelancer, Archive.org, Threads, AniList, TabNews** |
| **Videojuegos y Cultura Pop**| Muy básico / propenso a falsos positivos | **Roblox (API Oficial), Minecraft (NameMC/Mojang), Steam (XML), Lichess, Chess.com, Speedrun.com, GOG.com, Itch.io, AniList, MyAnimeList** |
| **Micro-API y Servidor SSE**| Inexistente (requiere wrappers externos) | **Servidor HTTP nativo integrado con transmisión SSE en tiempo real y panel Web** |
| **Importación como Librería**| Complejo de integrar en Node.js | `import { huntUsername } from 'patrickuser'` |

---

## 🚀 Inicio Rápido

Ejecútalo de forma **instantánea** con `npx` (sin instalación previa):

```bash
# Ejecución directa vía npx
npx patrickuser usuario_objetivo

# O instálalo de forma global
npm install -g patrickuser
patrickuser usuario_objetivo
```

O clona el repositorio y ejecútalo nativamente con Node.js:

```bash
git clone https://github.com/patrickuser/patrickuser.git
cd patrickuser

# Ejecutar CLI
node bin/patrickuser.js torvalds
```

---

## 💻 Uso y Ejemplos de la CLI

### 1. Investigación General
```bash
node bin/patrickuser.js john_doe
```

### 2. Filtrar por Categoría
Categorías disponibles: `tech`, `social`, `gaming`, `content`, `brasil`, `professional`, `community`.
```bash
node bin/patrickuser.js notch --category gaming
```

### 3. Plataformas Específicas
```bash
node bin/patrickuser.js alice --site github,reddit,tiktok,steam,minecraft
```

### 4. Control de Concurrencia y Tiempo de Espera (Timeout)
```bash
node bin/patrickuser.js target --concurrency 30 --timeout 5000
```

### 5. Exportación de Informes (JSON, CSV, Markdown)
```bash
# Generar reporte estructurado en Markdown
node bin/patrickuser.js target -o investigacion.md

# Generar hoja de cálculo en CSV
node bin/patrickuser.js target -o resultados.csv

# Emitir JSON estructurado hacia stdout
node bin/patrickuser.js target --json > salida.json
```

---

## 🌐 Micro-API y Servidor SSE en Tiempo Real con Panel Web

`patrickuser` incluye un servidor HTTP nativo sin dependencias que proporciona una interfaz web interactiva y endpoints de **Server-Sent Events (SSE)** listos para integración con frontends:

```bash
node bin/patrickuser.js --server -p 3000
```

Abre en tu navegador:
- 🖥️ **Panel Web:** `http://localhost:3000/`
- 📡 **Flujo SSE en Tiempo Real:** `http://localhost:3000/api/hunt?username=target`
- 📋 **Catálogo de Plataformas:** `http://localhost:3000/api/sites`

### Consumo del Flujo SSE en Frontend (React, Vue, Vanilla JS):
```javascript
const eventSource = new EventSource('http://localhost:3000/api/hunt?username=lucas');

// Emitido inmediatamente cuando se confirma un perfil con metadatos
eventSource.addEventListener('hit', (e) => {
  const result = JSON.parse(e.data);
  console.log(`[+] Encontrado en ${result.site}:`, result.metadata);
});

// Emitido tras cada plataforma verificada
eventSource.addEventListener('progress', (e) => {
  const stats = JSON.parse(e.data);
  console.log(`Progreso: ${stats.percent}% (${stats.checked}/${stats.total})`);
});

// Emitido cuando la investigación concluye
eventSource.addEventListener('done', (e) => {
  const summary = JSON.parse(e.data);
  console.log('Investigación finalizada:', summary);
  eventSource.close();
});
```

---

## 📦 Uso como Biblioteca NPM

```javascript
import { huntUsername, checkSite, getSites } from 'patrickuser';

const investigacion = await huntUsername('torvalds', {
  concurrency: 25,
  categories: ['tech', 'gaming'],
  onFound: (hit) => {
    console.log(`[+] Huella encontrada: ${hit.site} -> ${hit.url}`);
    if (hit.metadata?.name) console.log(`    Nombre: ${hit.metadata.name}`);
    if (hit.metadata?.avatarUrl) console.log(`    Avatar: ${hit.metadata.avatarUrl}`);
  },
  onChecked: (res, stats) => {
    console.log(`Progreso: ${stats.percent}%`);
  }
});

console.log(`Total encontrados: ${investigacion.found} perfiles en ${investigacion.durationMs}ms`);
```

---

## 🧩 Añadir una Nueva Plataforma en 30 Segundos

Simplemente añade una entrada en `data/sites.json`:

```json
{
  "name": "NuevaPlataforma",
  "url": "https://nuevaplataforma.com/{}",
  "category": "social",
  "errorType": "status_code",
  "errorCode": 404,
  "regexCheck": "^[a-zA-Z0-9_]{3,20}$"
}
```

Si la plataforma requiere cabeceras personalizadas, APIs GraphQL o JSON, crea un adaptador en `src/adapters/nuevaplataforma.js` y regístralo en `src/adapters/index.js`.

---

## 🧪 Pruebas Automatizadas

El proyecto utiliza el ejecutor de pruebas nativo de Node.js (`node:test`):

```bash
npm test
```

La suite de pruebas cubre:
- Extracción de metadatos (OpenGraph, Twitter Cards, esquemas JSON-LD).
- Validación y saneamiento por expresiones regulares en cada plataforma.
- Registro y ejecución de adaptadores especializados.
- Exportadores de reportes (JSON, CSV, Markdown).
- Microservidor HTTP nativo y transmisión SSE.

---

## 📜 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  <i>"Tyger Tyger, burning bright... En OSINT, observa lo que otros pasan por alto." — Equipo PatrickUser</i>
</p>
