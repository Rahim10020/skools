import { Module } from '@nestjs/common';
import { TeacherAssignmentsService } from './teacher-assignments.service.js';
import { TeacherAssignmentsController } from './teacher-assignments.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [TeacherAssignmentsController],
  providers: [TeacherAssignmentsService],
  exports: [TeacherAssignmentsService],
})
export class TeacherAssignmentsModule {}
