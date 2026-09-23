import { Module } from '@nestjs/common';
import { ReportCardsService } from './report-cards.service.js';
import { ReportCardsController } from './report-cards.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ReportCardsController],
  providers: [ReportCardsService],
  exports: [ReportCardsService],
})
export class ReportCardsModule {}
