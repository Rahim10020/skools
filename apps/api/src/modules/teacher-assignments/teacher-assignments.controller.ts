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
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('teacher-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.CENSEUR)
export class TeacherAssignmentsController {
  constructor(
    private readonly teacherAssignmentsService: TeacherAssignmentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateTeacherAssignmentDto, @Request() req: any) {
    return this.teacherAssignmentsService.create(req.user.establishmentId, dto);
  }

  @Get()
  @Roles(Role.DIRECTOR, Role.CENSEUR, Role.TEACHER)
  findAll(@Request() req: any) {
    return this.teacherAssignmentsService.findAll(req.user.establishmentId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.teacherAssignmentsService.remove(id, req.user.establishmentId);
  }
}
