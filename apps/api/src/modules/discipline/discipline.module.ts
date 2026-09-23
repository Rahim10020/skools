import { Module } from '@nestjs/common';
import { DisciplineService } from './discipline.service.js';
import { DisciplineController } from './discipline.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [DisciplineController],
  providers: [DisciplineService],
  exports: [DisciplineService],
})
export class DisciplineModule {}
