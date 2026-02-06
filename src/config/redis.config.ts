import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const getRedisClient = (configService: ConfigService): Redis => {
  return new Redis({
    host: configService.get('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    retryStrategy: (times: number) => {
      return Math.min(times * 50, 2000);
    },
  });
};
