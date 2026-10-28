/**
 * @file adapters/500px.js - 500px GraphQL Adapter
 */
import { request } from '../core/http.js';

/**
 * Check 500px profile via Apollo GraphQL endpoint
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function check500px(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://500px.com/p/${encodeURIComponent(username)}`;

  try {
    const res = await request('https://api-neo.500px.com/graphql', {
      method: 'POST',
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        query: 'query GetUser($u: String!) { getUser(username: $u) { id username displayName avatar } }',
        variables: { u: username }
      }
    });

    if (res.status === 200 && res.text) {
      try {
        const json = JSON.parse(res.text);
        const user = json.data?.getUser;
        if (user && user.id) {
          return {
            site: '500px',
            category: 'professional',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: user.displayName || user.username,
              avatarUrl: user.avatar || null,
              extra: {
                id: user.id
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: '500px',
      category: 'professional',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: '500px',
      category: 'professional',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

