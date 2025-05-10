const { createClient } = require("redis");
const { cachedKeys } = require("./utils");
class RedisManager {
  static instance;
  redisClient;

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
    });
    this.redisClient.connect();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  async set(key, value) {
    await this.redisClient.set(key, JSON.stringify(value));
  }

  async get(key) {
    return JSON.parse(await this.redisClient.get(key));
  }

  async delete(key) {
    await this.redisClient.del(key);
  }

  async deleteByPattern(pattern) {
    const keys = await this.redisClient.keys(pattern);
    if (keys.length) {
      await this.redisClient.del(keys);
    }
  }

  async close() {
    await this.redisClient.quit();
  }

  async setWithTTL(key, value, ttl) {
    await this.redisClient.set(key, JSON.stringify(value), "EX", ttl);
  }

  async clearAllKeys() {
    await this.getKeysByPattern(cachedKeys.CN_LIST + ":*");
    await this.getKeysByPattern(cachedKeys.CANDIDATES + ":*");
    await this.getKeysByPattern(cachedKeys.PARTY + ":*");
    await this.redisClient.del(cachedKeys.CANDIDATES);
    await this.redisClient.del(cachedKeys.CONSTITUENCY);
    await this.redisClient.del(cachedKeys.HOT_CANDIDATES);
    await this.redisClient.del(cachedKeys.PARTY);
    await this.redisClient.del(cachedKeys.ASSEMBLY_ELECTION);
    await this.redisClient.del(cachedKeys.CN_LIST);
    await this.redisClient.del(cachedKeys.STATE_ELECTION);
    await this.redisClient.del(cachedKeys.ELECTION);
    await this.getKeysByPattern(cachedKeys.ASSEMBLY_ELECTION + ":*");
    await this.getKeysByPattern(cachedKeys.WIDGET + "_*");
  }

  async getKeysByPattern(pattern) {
    const keys = await this.redisClient.keys(pattern);
    for (const key of keys) {
      await this.redisClient.del(key);
    }
  }
}

module.exports = RedisManager;
