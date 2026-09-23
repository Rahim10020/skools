import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service.js';
import { AttendancesController } from './attendances.controller.js';

@Module({
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
