import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReportCardsService } from './report-cards.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('report-cards')
@UseGuards(JwtAuthGuard)
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Get('student')
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
    );
  }

  @Get('classroom')
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
