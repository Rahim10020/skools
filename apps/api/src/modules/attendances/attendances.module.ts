import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service.js';
import { AttendancesController } from './attendances.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
