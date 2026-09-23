import { Module } from '@nestjs/common';
import { ParentStudentsService } from './parent-students.service.js';
import { ParentStudentsController } from './parent-students.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ParentStudentsController],
  providers: [ParentStudentsService],
  exports: [ParentStudentsService],
})
export class ParentStudentsModule {}
