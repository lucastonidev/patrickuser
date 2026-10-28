/**
 * @file adapters/roblox.js - Roblox API Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Roblox account via official Users API & Avatar thumbnails
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkRoblox(username, options = {}) {
  const startTime = Date.now();
  let profileUrl = `https://www.roblox.com/user.aspx?username=${encodeURIComponent(username)}`;

  try {
    const res = await request('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        usernames: [username]
      }
    });

    if (res.status === 200 && res.text) {
      try {
        const json = JSON.parse(res.text);
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const user = json.data[0];
          const userId = user.id;
          profileUrl = `https://www.roblox.com/users/${userId}/profile`;

          // Try fetching avatar thumbnail
          let avatarUrl = null;
          try {
            const thumbRes = await request(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`, {
              timeout: 4000,
              signal: options.signal
            });
            if (thumbRes.status === 200) {
              const thumbJson = JSON.parse(thumbRes.text);
              avatarUrl = thumbJson.data?.[0]?.imageUrl || null;
            }
          } catch {
            // Optional thumbnail
          }

          return {
            site: 'Roblox',
            category: 'gaming',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: user.displayName || user.name,
              avatarUrl,
              extra: {
                userId,
                username: user.name,
                hasVerifiedBadge: user.hasVerifiedBadge || false
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: 'Roblox',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Roblox',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

