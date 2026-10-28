/**
 * @file adapters/apoiase.js - Apoia.se GraphQL Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Apoia.se creator campaign via public GraphQL endpoint
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkApoiaSe(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://apoia.se/${encodeURIComponent(username)}`;

  try {
    const res = await request('https://graphql.apoia.se/', {
      method: 'POST',
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        query: 'query GetCampaign($slug: String!) { campaign(slug: $slug) { _id name status } }',
        variables: { slug: username.toLowerCase() }
      }
    });

    if (res.status === 200 && res.text) {
      try {
        const json = JSON.parse(res.text);
        if (json.data && json.data.campaign && json.data.campaign._id) {
          const c = json.data.campaign;
          return {
            site: 'Apoia.se',
            category: 'brasil',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: c.name || username,
              extra: {
                campaignId: c._id,
                status: c.status
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: 'Apoia.se',
      category: 'brasil',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Apoia.se',
      category: 'brasil',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
