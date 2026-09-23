import { Module } from '@nestjs/common';
import { GradesService } from './grades.service.js';
import { GradesController } from './grades.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
