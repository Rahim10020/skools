import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { ExamsController } from './exams.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
