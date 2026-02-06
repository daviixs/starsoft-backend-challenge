import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getRedisClient } from '../config/redis.config';

@Injectable()
export class RedisLockService implements OnModuleInit {
  private readonly logger = new Logger(RedisLockService.name);
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redisClient = getRedisClient(this.configService);
    this.logger.log('Redis client initialized');
  }

  /**
   * Tenta adquirir um lock distribuído
   * @param key - Chave única do lock
   * @param ttlMs - Tempo de vida do lock em milissegundos
   * @param retries - Número de tentativas
   * @param retryDelayMs - Delay entre tentativas
   */
  async acquire(
    key: string,
    ttlMs: number = 5000,
    retries: number = 3,
    retryDelayMs: number = 50,
  ): Promise<string | null> {
    const lockValue = `${Date.now()}-${Math.random()}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // SET NX (só seta se não existir) + PX (expira em ms)
        const result = await this.redisClient.set(
          key,
          lockValue,
          'PX',
          ttlMs,
          'NX',
        );

        if (result === 'OK') {
          this.logger.debug(`Lock acquired: ${key}`);
          return lockValue;
        }

        if (attempt < retries) {
          await this.sleep(retryDelayMs * (attempt + 1)); // Backoff exponencial
        }
      } catch (error) {
        this.logger.error(`Error acquiring lock ${key}:`, error);
      }
    }

    this.logger.warn(`Failed to acquire lock after ${retries} retries: ${key}`);
    return null;
  }

  /**
   * Libera um lock específico
   */
  async release(key: string, lockValue: string): Promise<boolean> {
    try {
      // Lua script para garantir que só liberamos nosso próprio lock
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
    } catch (error) {
      this.logger.error(`Error releasing lock ${key}:`, error);
      return false;
    }
  }

  /**
   * Adquire múltiplos locks em ordem (anti-deadlock)
   */
  async acquireMultiple(
    keys: string[],
    ttlMs: number = 5000,
  ): Promise<Map<string, string> | null> {
    const sortedKeys = [...keys].sort(); // Ordem alfabética previne deadlock
    const acquiredLocks = new Map<string, string>();

    try {
      for (const key of sortedKeys) {
        const lockValue = await this.acquire(key, ttlMs);

        if (!lockValue) {
          // Falhou, libera todos já adquiridos
          await this.releaseMultiple(acquiredLocks);
          return null;
        }

        acquiredLocks.set(key, lockValue);
      }

      return acquiredLocks;
    } catch (error) {
      await this.releaseMultiple(acquiredLocks);
      throw error;
    }
  }

  /**
   * Libera múltiplos locks
   */
  async releaseMultiple(locks: Map<string, string>): Promise<void> {
    const promises = Array.from(locks.entries()).map(([key, value]) =>
      this.release(key, value),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Cache simples com TTL
   */
  async setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async getCache<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  async delCache(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
