import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisLockService implements OnModuleInit {
    private configService;
    private readonly logger;
    private redisClient;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    acquire(key: string, ttlMs?: number, retries?: number, retryDelayMs?: number): Promise<string | null>;
    release(key: string, lockValue: string): Promise<boolean>;
    acquireMultiple(keys: string[], ttlMs?: number): Promise<Map<string, string> | null>;
    releaseMultiple(locks: Map<string, string>): Promise<void>;
    setCache(key: string, value: any, ttlSeconds: number): Promise<void>;
    getCache<T>(key: string): Promise<T | null>;
    delCache(key: string): Promise<void>;
    private sleep;
}
