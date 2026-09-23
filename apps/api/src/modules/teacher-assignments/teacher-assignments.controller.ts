import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TeacherAssignmentsService } from './teacher-assignments.service.js';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('teacher-assignments')
@UseGuards(JwtAuthGuard)
export class TeacherAssignmentsController {
  constructor(
    private readonly teacherAssignmentsService: TeacherAssignmentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateTeacherAssignmentDto, @Request() req: any) {
    return this.teacherAssignmentsService.create(req.user.establishmentId, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.teacherAssignmentsService.findAll(req.user.establishmentId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.teacherAssignmentsService.remove(id, req.user.establishmentId);
  }
}
