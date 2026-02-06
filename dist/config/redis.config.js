"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const getRedisClient = (configService) => {
    return new ioredis_1.default({
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        retryStrategy: (times) => {
            return Math.min(times * 50, 2000);
        },
    });
};
exports.getRedisClient = getRedisClient;
//# sourceMappingURL=redis.config.js.map