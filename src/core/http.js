/**
 * @file http.js - High-Performance HTTP Client with User-Agent Rotation & Keep-Alive
 */

const MODERN_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
];

/**
 * Get a random realistic User-Agent string
 * @returns {string}
 */
export function getRandomUserAgent() {
  const index = Math.floor(Math.random() * MODERN_USER_AGENTS.length);
  return MODERN_USER_AGENTS[index];
}

/**
 * Generate standard browser headers
 * @param {Record<string, string>} [customHeaders={}]
 * @returns {Record<string, string>}
 */
export function getDefaultHeaders(customHeaders = {}) {
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    ...customHeaders
  };
}

/**
 * Fetch a URL with automatic timeout, signal linking, and response truncation
 * @param {string} url
 * @param {Object} [options]
 * @param {string} [options.method='GET']
 * @param {Record<string, string>} [options.headers]
 * @param {any} [options.body]
 * @param {number} [options.timeout=10000]
 * @param {RequestRedirect} [options.redirect='follow']
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.maxBytes=524288] - Default 512KB max payload to conserve memory
 * @returns {Promise<{ status: number, statusText: string, finalUrl: string, headers: Headers, text: string }>}
 */
export async function request(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = 10000,
    redirect = 'follow',
    signal: externalSignal,
    maxBytes = 1572864 // 1.5MB max payload to capture full metadata on large pages
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Timeout after ${timeout}ms`));
  }, timeout);

  // Link external signal if provided
  let externalAbortListener;
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw externalSignal.reason || new Error('Request aborted by external signal');
    }
    externalAbortListener = () => controller.abort(externalSignal.reason);
    externalSignal.addEventListener('abort', externalAbortListener);
  }

  try {
    const finalHeaders = getDefaultHeaders(headers);
    const fetchOptions = {
      method,
      headers: finalHeaders,
      redirect,
      signal: controller.signal
    };

    if (body) {
      fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : body;
    }

    const response = await fetch(url, fetchOptions);

    let text = '';
    if (response.body && method !== 'HEAD') {
      const reader = response.body.getReader();
      const chunks = [];
      let bytesRead = 0;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.byteLength;
        chunks.push(decoder.decode(value, { stream: true }));
        if (bytesRead >= maxBytes) {
          try {
            await reader.cancel();
          } catch {
            // ignore stream cancel errors
          }
          break;
        }
      }
      text = chunks.join('');
    }

    return {
      status: response.status,
      statusText: response.statusText,
      finalUrl: response.url || url,
      headers: response.headers,
      text
    };
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal && externalAbortListener) {
      externalSignal.removeEventListener('abort', externalAbortListener);
    }
  }
}

