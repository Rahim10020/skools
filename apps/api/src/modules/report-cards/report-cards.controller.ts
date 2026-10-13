import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReportCardsService } from './report-cards.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('report-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Get('student')
  @Roles(Role.DIRECTOR, Role.CENSEUR, Role.STUDENT, Role.PARENT)
  getStudentReport(
    @Query('studentId', ParseUUIDPipe) studentId: string,
    @Query('academicYearId', ParseUUIDPipe) academicYearId: string,
    @Query('periodId') periodId: string | undefined,
    @Request() req: any,
  ) {
    return this.reportCardsService.getStudentReport(
      req.user.establishmentId,
      studentId,
      academicYearId,
      periodId,
      { id: req.user.id, role: req.user.role },
    );
  }

  @Get('classroom')
  @Roles(Role.DIRECTOR, Role.CENSEUR)
  getClassroomOverview(
    @Query('classroomId', ParseUUIDPipe) classroomId: string,
    @Query('academicYearId', ParseUUIDPipe) academicYearId: string,
    @Request() req: any,
  ) {
    return this.reportCardsService.getClassroomOverview(
      req.user.establishmentId,
      classroomId,
      academicYearId,
    );
  }
}
