"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisLockService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisLockService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_config_1 = require("../config/redis.config");
let RedisLockService = RedisLockService_1 = class RedisLockService {
    configService;
    logger = new common_1.Logger(RedisLockService_1.name);
    redisClient;
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        this.redisClient = (0, redis_config_1.getRedisClient)(this.configService);
        this.logger.log('Redis client initialized');
    }
    async acquire(key, ttlMs = 5000, retries = 3, retryDelayMs = 50) {
        const lockValue = `${Date.now()}-${Math.random()}`;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const result = await this.redisClient.set(key, lockValue, 'PX', ttlMs, 'NX');
                if (result === 'OK') {
                    this.logger.debug(`Lock acquired: ${key}`);
                    return lockValue;
                }
                if (attempt < retries) {
                    await this.sleep(retryDelayMs * (attempt + 1));
                }
            }
            catch (error) {
                this.logger.error(`Error acquiring lock ${key}:`, error);
            }
        }
        this.logger.warn(`Failed to acquire lock after ${retries} retries: ${key}`);
        return null;
    }
    async release(key, lockValue) {
        try {
            const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
            const result = await this.redisClient.eval(script, 1, key, lockValue);
            if (result === 1) {
                this.logger.debug(`Lock released: ${key}`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Error releasing lock ${key}:`, error);
            return false;
        }
    }
    async acquireMultiple(keys, ttlMs = 5000) {
        const sortedKeys = [...keys].sort();
        const acquiredLocks = new Map();
        try {
            for (const key of sortedKeys) {
                const lockValue = await this.acquire(key, ttlMs);
                if (!lockValue) {
                    await this.releaseMultiple(acquiredLocks);
                    return null;
                }
                acquiredLocks.set(key, lockValue);
            }
            return acquiredLocks;
        }
        catch (error) {
            await this.releaseMultiple(acquiredLocks);
            throw error;
        }
    }
    async releaseMultiple(locks) {
        const promises = Array.from(locks.entries()).map(([key, value]) => this.release(key, value));
        await Promise.allSettled(promises);
    }
    async setCache(key, value, ttlSeconds) {
        await this.redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    }
    async getCache(key) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
    }
    async delCache(key) {
        await this.redisClient.del(key);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.RedisLockService = RedisLockService;
exports.RedisLockService = RedisLockService = RedisLockService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisLockService);
//# sourceMappingURL=redis-lock.service.js.map