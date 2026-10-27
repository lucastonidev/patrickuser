/**
 * @file adapters/steam.js - Steam Community Rich Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Steam Community profile via XML endpoint
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkSteam(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://steamcommunity.com/id/${encodeURIComponent(username)}`;

  try {
    const xmlUrl = `https://steamcommunity.com/id/${encodeURIComponent(username)}/?xml=1`;
    const res = await request(xmlUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal
    });

    if (res.status === 200 && res.text) {
      if (res.text.includes('<error><![CDATA[The specified profile could not be found.]]></error>') ||
          res.text.includes('<error>The specified profile could not be found.</error>')) {
        return {
          site: 'Steam',
          category: 'gaming',
          exists: false,
          url: profileUrl,
          httpStatus: 200,
          durationMs: Date.now() - startTime
        };
      }

      if (res.text.includes('<steamID64>')) {
        const steamId64Match = res.text.match(/<steamID64>(\d+)<\/steamID64>/);
        const steamIdMatch = res.text.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/) || res.text.match(/<steamID>(.*?)<\/steamID>/);
        const avatarMatch = res.text.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/) || res.text.match(/<avatarFull>(.*?)<\/avatarFull>/);
        const summaryMatch = res.text.match(/<summary><!\[CDATA\[([\s\S]*?)\]\]><\/summary>/) || res.text.match(/<summary>([\s\S]*?)<\/summary>/);
        const stateMessageMatch = res.text.match(/<stateMessage><!\[CDATA\[(.*?)\]\]><\/stateMessage>/);

        const steamId64 = steamId64Match ? steamId64Match[1] : null;
        const name = steamIdMatch ? steamIdMatch[1].trim() : username;
        const avatarUrl = avatarMatch ? avatarMatch[1].trim() : null;
        const bio = summaryMatch ? summaryMatch[1].replace(/<[^>]*>/g, '').trim() : null;
        const state = stateMessageMatch ? stateMessageMatch[1].trim() : null;

        return {
          site: 'Steam',
          category: 'gaming',
          exists: true,
          url: profileUrl,
          httpStatus: 200,
          durationMs: Date.now() - startTime,
          metadata: {
            name,
            bio,
            avatarUrl,
            extra: {
              steamId64,
              stateMessage: state
            }
          }
        };
      }
    }

    return {
      site: 'Steam',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Steam',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
