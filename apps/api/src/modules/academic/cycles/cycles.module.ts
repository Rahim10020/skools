import { Module } from '@nestjs/common';
import { CyclesService } from './cycles.service.js';
import { CyclesController } from './cycles.controller.js';

@Module({
  controllers: [CyclesController],
  providers: [CyclesService],
  exports: [CyclesService],
})
export class CyclesModule {}
