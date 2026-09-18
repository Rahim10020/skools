import { Module } from '@nestjs/common';
import { LevelsService } from './levels.service.js';
import { LevelsController } from './levels.controller.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [LevelsController],
  providers: [LevelsService],
  exports: [LevelsService],
})
export class LevelsModule {}
