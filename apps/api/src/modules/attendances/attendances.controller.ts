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

@Controller('attendances')
@UseGuards(JwtAuthGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  create(@Body() dto: CreateAttendanceDto, @Request() req: any) {
    return this.attendancesService.create(
      req.user.establishmentId,
      req.user.id,
      dto,
    );
  }

  @Post('bulk')
  bulkCreate(@Body() dto: BulkAttendanceDto, @Request() req: any) {
    return this.attendancesService.bulkCreate(
      req.user.establishmentId,
      req.user.id,
      dto,
    );
  }

  @Get()
  findByClassroomAndDate(
    @Query('classroomId') classroomId: string,
    @Query('date') date: string,
    @Request() req: any,
  ) {
    return this.attendancesService.findByClassroomAndDate(
      req.user.establishmentId,
      classroomId,
      date,
    );
  }
}
