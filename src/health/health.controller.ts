import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private redisClient: Redis;

  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
    });
  }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Verificar saúde da aplicação' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redisCheck(),
    ]);
  }

  private async redisCheck(): Promise<HealthIndicatorResult> {
    try {
      await this.redisClient.ping();
      return { redis: { status: 'up' } };
    } catch (error) {
      return { redis: { status: 'down', error: (error as Error).message } };
    }
  }
}
