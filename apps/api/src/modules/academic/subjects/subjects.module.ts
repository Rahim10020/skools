import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service.js';
import { SubjectsController } from './subjects.controller.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
