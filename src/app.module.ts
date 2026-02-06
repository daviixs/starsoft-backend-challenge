import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { getDatabaseConfig } from './config/database.config';
import { SharedModule } from './shared/shared.module';
import { SessionsModule } from './sessions/sessions.module';
import { BookingsModule } from './booking/booking.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuração global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // Schedule (Cron jobs)
    ScheduleModule.forRoot(),

    // Rate Limiting - 60 requests por minuto por IP
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 60,
        },
        {
          name: 'strict',
          ttl: 60000,
          limit: 10,
        },
      ],
    }),

    // Módulos compartilhados
    SharedModule,

    // Módulos de negócio
    SessionsModule,
    BookingsModule,

    // Health check
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
