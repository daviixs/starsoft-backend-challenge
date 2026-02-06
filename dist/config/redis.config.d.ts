import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare const getRedisClient: (configService: ConfigService) => Redis;
