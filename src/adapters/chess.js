/**
 * @file adapters/chess.js - Chess.com Rich Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Chess.com profile and extract ratings and joined date
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkChess(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://www.chess.com/member/${encodeURIComponent(username)}`;

  try {
    const apiUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}`;
    const res = await request(apiUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PatrickUser-Mentalist-OSINT'
      }
    });

    if (res.status === 200) {
      try {
        const player = JSON.parse(res.text);
        if (player && player.username) {
          // Fetch ratings
          let rapidRating = null;
          let blitzRating = null;
          try {
            const statsRes = await request(`https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/stats`, {
              timeout: 4000,
              signal: options.signal
            });
            if (statsRes.status === 200) {
              const stats = JSON.parse(statsRes.text);
              rapidRating = stats.chess_rapid?.last?.rating || null;
              blitzRating = stats.chess_blitz?.last?.rating || null;
            }
          } catch {
            // stats are optional
          }

          return {
            site: 'Chess.com',
            category: 'gaming',
            exists: true,
            url: player.url || profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: player.name || player.username,
              avatarUrl: player.avatar || null,
              location: player.location || null,
              followers: player.followers || null,
              extra: {
                status: player.status,
                rapidRating,
                blitzRating,
                joined: player.joined ? new Date(player.joined * 1000).toISOString() : null,
                isStreamer: player.is_streamer || false
              }
            }
          };
        }
      } catch {
        // fall through
      }
    }

    return {
      site: 'Chess.com',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Chess.com',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

