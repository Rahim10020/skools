import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service.js';
import { CreateAttendanceDto } from './dto/create-attendance.dto.js';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  @Roles(Role.DIRECTOR, Role.TEACHER, Role.SURVEILLANT)
  create(@Body() dto: CreateAttendanceDto, @Request() req: any) {
    return this.attendancesService.create(
      req.user.establishmentId,
      req.user.id,
      dto,
    );
  }

  @Post('bulk')
  @Roles(Role.DIRECTOR, Role.TEACHER, Role.SURVEILLANT)
  bulkCreate(@Body() dto: BulkAttendanceDto, @Request() req: any) {
    return this.attendancesService.bulkCreate(
      req.user.establishmentId,
      req.user.id,
      dto,
    );
  }

  @Get()
  @Roles(
    Role.DIRECTOR,
    Role.ADMIN,
    Role.CENSEUR,
    Role.TEACHER,
    Role.SURVEILLANT,
    Role.STUDENT,
    Role.PARENT,
  )
  findByClassroomAndDate(
    @Query('classroomId') classroomId: string,
    @Query('date') date: string,
    @Request() req: any,
  ) {
    return this.attendancesService.findByClassroomAndDate(
      req.user.establishmentId,
      classroomId,
      date,
      { id: req.user.id, role: req.user.role },
    );
  }
}
