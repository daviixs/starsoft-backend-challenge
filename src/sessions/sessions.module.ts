import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Session } from '../modules/sessions/entities/session.entity';
import { Seat } from '../modules/sessions/entities/seat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Seat])],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
