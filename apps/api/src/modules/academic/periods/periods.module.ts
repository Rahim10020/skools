import { Module } from '@nestjs/common';
import { PeriodsService } from './periods.service.js';
import { PeriodsController } from './periods.controller.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [PeriodsController],
  providers: [PeriodsService],
  exports: [PeriodsService],
})
export class PeriodsModule {}
