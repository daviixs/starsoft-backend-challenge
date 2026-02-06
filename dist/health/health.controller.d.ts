import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
export declare class HealthController {
    private health;
    private db;
    private configService;
    private redisClient;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, configService: ConfigService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    private redisCheck;
}
