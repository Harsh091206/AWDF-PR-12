const NodeCache = require('node-cache');

const configuredTtl = process.env.CACHE_TTL_SECONDS;
const ttlSeconds = configuredTtl === undefined ? 60 : Number(configuredTtl);

if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1) {
  throw new Error('CACHE_TTL_SECONDS must be a positive integer');
}

const taskCache = new NodeCache({ stdTTL: ttlSeconds });
const cacheStats = { hits: 0, misses: 0 };

const getTaskCacheKey = (id) => `task:${id.toLowerCase()}`;

module.exports = { taskCache, cacheStats, getTaskCacheKey, ttlSeconds };
