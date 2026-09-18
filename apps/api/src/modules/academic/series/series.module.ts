import { Module } from '@nestjs/common';
import { SeriesService } from './series.service.js';
import { SeriesController } from './series.controller.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [SeriesController],
  providers: [SeriesService],
  exports: [SeriesService],
})
export class SeriesModule {}
