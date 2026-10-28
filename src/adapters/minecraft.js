/**
 * @file adapters/minecraft.js - Minecraft & NameMC Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Minecraft account via official Mojang API & NameMC
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkMinecraft(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://namemc.com/profile/${encodeURIComponent(username)}`;

  try {
    const mojangUrl = `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`;
    const res = await request(mojangUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.status === 200 && res.text) {
      try {
        const data = JSON.parse(res.text);
        if (data && data.id && data.name) {
          const uuid = data.id;
          const avatarUrl = `https://mc-heads.net/avatar/${uuid}/150`;

          return {
            site: 'Minecraft (NameMC)',
            category: 'gaming',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: data.name,
              avatarUrl,
              extra: {
                uuid,
                namemcUrl: profileUrl
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: 'Minecraft (NameMC)',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Minecraft (NameMC)',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

