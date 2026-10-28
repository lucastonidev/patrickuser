# ☕ PatrickUser (The Mentalist OSINT Hunter)

> *"Sherlock looked for physical footprints. Patrick Jane reads what people leave behind in plain sight."*  
> **O Sucessor Turbinado do Sherlock para Investigação OSINT em 100% JavaScript Nativo (Node.js ESM).**

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

Inspirado no estilo analítico, observador e perspicaz de **Patrick Jane** da série *The Mentalist*, **`patrickuser`** é uma plataforma moderna de OSINT projetada para encontrar a presença digital de um `@username` em dezenas de plataformas globais e brasileiras, **não apenas verificando se uma página existe**, mas observando e extraindo **metadados ricos**: nome real, biografia, avatar em alta definição, número de seguidores, reputação, ofensivas/streaks e histórico público.

---

## ⚡ Por que PatrickUser é Superior ao Sherlock Original?

| Recurso | 🔍 Sherlock Original (Python) | ☕ PatrickUser (The Mentalist) |
| :--- | :--- | :--- |
| **Linguagem & Runtime** | Python 3 (requer `pip`, `venv`, dependências C) | **100% JavaScript Moderno (Node.js ESM)** |
| **Instalação / Build** | Instalação pesada, incompatibilidades de versão | **Zero Build Step** (`npx patrickuser target`) |
| **Dependências Externas** | Múltiplas (`requests`, `tor`, etc.) | **Zero dependências em tempo de execução** |
| **Tempo de Inicialização** | ~800ms a 2s | **< 20ms** |
| **Extração de Metadados** | Apenas link do perfil | **Nome real, Bio, Avatar HD, Seguidores, Streaks, Karma** |
| **Adapters Especializados** | Raros / limitados | **GitHub, Reddit, Steam, Roblox, Minecraft, Lichess, Chess, Speedrun, Duolingo, Bluesky, 500px, Apoia.se, Mixcloud, Dailymotion, Freelancer, Archive.org, Threads, AniList, TabNews** |
| **Gaming & Pop Culture** | Básico / sem API | **Roblox, Minecraft (NameMC/Mojang), Steam (XML/SteamID64), Lichess, Chess.com, Speedrun.com, Itch.io, AniList, MyAnimeList** |
| **Ecossistema Brasileiro** | Suporte quase nulo | **TabNews, Filmow, Jusbrasil, Vakinha, Apoia.se (GraphQL)** |
| **Servidor Micro-API + SSE** | Inexistente (requer wrappers) | **Nativo com streaming SSE em tempo real e Web GUI** |
| **Integração como Lib** | Complexa em Node | `import { huntUsername } from 'patrickuser'` |

---

## 🚀 Instalação e Uso Rápido

Você pode rodar **instantaneamente** via `npx` sem instalar nada previamente:

```bash
# Execução direta via npx
npx patrickuser target_username

# Ou instalar globalmente
npm install -g patrickuser
patrickuser target_username
```

Ou clonar o repositório e rodar nativamente:

```bash
git clone https://github.com/patrickuser/patrickuser.git
cd patrickuser

# Executar a CLI
node bin/patrickuser.js torvalds
```

---

## 💻 Exemplos de Linha de Comando (CLI)

### 1. Caçada Geral
```bash
node bin/patrickuser.js john_doe
```

### 2. Filtrar por Categorias
Categorias suportadas: `tech`, `social`, `gaming`, `content`, `brasil`, `professional`.
```bash
node bin/patrickuser.js lucas --category tech,brasil
```

### 3. Caçada Específica em Plataformas
```bash
node bin/patrickuser.js alice --site github,reddit,duolingo,steam
```

### 4. Controle de Concorrência e Timeout
```bash
node bin/patrickuser.js target --concurrency 30 --timeout 5000
```

### 5. Exportar Relatórios Investigativos (JSON, CSV, Markdown)
```bash
# Gerar relatório em Markdown
node bin/patrickuser.js target -o relatorio.md

# Gerar planilha CSV
node bin/patrickuser.js target -o alvos.csv

# Exportar JSON estruturado
node bin/patrickuser.js target --json > resultado.json
```

---

## 🌐 Servidor Micro-API & Streaming SSE com Web GUI

O `patrickuser` inclui um servidor HTTP nativo com **zero dependências** que disponibiliza uma interface web interativa e endpoints com **Server-Sent Events (SSE)** para plugar em qualquer dashboard ou front-end:

```bash
node bin/patrickuser.js --server -p 3000
```

Abra no navegador:
- 🖥️ **Interface Web:** `http://localhost:3000/`
- 📡 **Stream SSE:** `http://localhost:3000/api/hunt?username=alvo`
- 📋 **Catálogo de Sites:** `http://localhost:3000/api/sites`

### Consumindo o Stream SSE no Frontend (React / Vue / Vanilla JS):
```javascript
const eventSource = new EventSource('http://localhost:3000/api/hunt?username=lucas');

// Recebe cada conta encontrada em tempo real com metadados
eventSource.addEventListener('hit', (e) => {
  const result = JSON.parse(e.data);
  console.log(`[+] Encontrado em ${result.site}:`, result.metadata);
});

// Acompanha a barra de progresso (porcentagem e plataformas checadas)
eventSource.addEventListener('progress', (e) => {
  const stats = JSON.parse(e.data);
  console.log(`Progresso: ${stats.percent}% (${stats.checked}/${stats.total})`);
});

// Finalização da caçada
eventSource.addEventListener('done', (e) => {
  const summary = JSON.parse(e.data);
  console.log('Investigação finalizada:', summary);
  eventSource.close();
});
```

---

## 📦 Como Usar como Biblioteca NPM

```javascript
import { huntUsername, checkSite, getSites } from 'patrickuser';

// Caçada completa com callback em tempo real
const investigation = await huntUsername('torvalds', {
  concurrency: 25,
  categories: ['tech', 'gaming'],
  onFound: (hit) => {
    console.log(`[+] Encontrado: ${hit.site} -> ${hit.url}`);
    if (hit.metadata?.name) console.log(`    Nome: ${hit.metadata.name}`);
    if (hit.metadata?.avatarUrl) console.log(`    Avatar: ${hit.metadata.avatarUrl}`);
  },
  onChecked: (res, stats) => {
    console.log(`Progresso: ${stats.percent}%`);
  }
});

console.log(`Total encontrado: ${investigation.found} contas em ${investigation.durationMs}ms`);
```

---

## 🧩 Adicionando uma Nova Plataforma em 30 Segundos

Basta adicionar uma entrada no arquivo `data/sites.json`:

```json
{
  "name": "NovaRede",
  "url": "https://novarede.com/{}",
  "category": "social",
  "errorType": "status_code",
  "errorCode": 404,
  "regexCheck": "^[a-zA-Z0-9_]{3,20}$"
}
```

Ou, se a plataforma possuir uma API rica que exija tratamento especial (como tokens, XML ou GraphQL), crie um arquivo em `src/adapters/nomedarede.js` e registre-o no `src/adapters/index.js`.

---

## 🧪 Testes Automatizados

O projeto utiliza o test runner nativo do Node.js (`node:test`):

```bash
npm test
```

Resultados dos testes cobrem:
- Detecção e parser de OpenGraph, Twitter Cards e Schemas JSON-LD.
- Validação e sanitização de regex por plataforma.
- Registro e execução de adapters especializados.
- Exportadores de dados (JSON, CSV, Markdown).
- Servidor HTTP e streaming SSE.

---

## 📜 Licença

Distribuído sob a licença **MIT**. Veja [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  <i>"No OSINT investigation is complete without keen observation." — PatrickUser Team</i>
</p>

