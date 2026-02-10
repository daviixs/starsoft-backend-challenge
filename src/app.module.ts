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
    
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),

    
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    
    ScheduleModule.forRoot(),

    
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

    
    SharedModule,

    
    SessionsModule,
    BookingsModule,

    
    HealthModule,
  ],
  providers:
    process.env.NODE_ENV === 'test'
      ? []
      : [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ],
})
export class AppModule {}
