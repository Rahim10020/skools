import { Module } from '@nestjs/common';
import { LevelsService } from './levels.service.js';
import { LevelsController } from './levels.controller.js';

@Module({
  controllers: [LevelsController],
  providers: [LevelsService],
  exports: [LevelsService],
})
export class LevelsModule {}
