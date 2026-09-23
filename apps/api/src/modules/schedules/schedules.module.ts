import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service.js';
import { SchedulesController } from './schedules.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
