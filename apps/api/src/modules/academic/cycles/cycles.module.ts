import { Module } from '@nestjs/common';
import { CyclesService } from './cycles.service.js';
import { CyclesController } from './cycles.controller.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [CyclesController],
  providers: [CyclesService],
  exports: [CyclesService],
})
export class CyclesModule {}
