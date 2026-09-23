import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { GradesService } from './grades.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { UpdateGradeDto } from './dto/update-grade.dto.js';
import { BulkGradesDto } from './dto/bulk-grades.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('grades')
@UseGuards(JwtAuthGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  create(@Body() dto: CreateGradeDto, @Request() req: any) {
    return this.gradesService.create(req.user.establishmentId, dto);
  }

  @Post('bulk')
  bulkCreate(@Body() dto: BulkGradesDto, @Request() req: any) {
    return this.gradesService.bulkCreate(req.user.establishmentId, dto);
  }

  @Get()
  findAll(@Request() req: any, @Query('examId') examId?: string) {
    if (examId) {
      return this.gradesService.findByExam(examId, req.user.establishmentId);
    }
    return this.gradesService.findAll(req.user.establishmentId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeDto,
    @Request() req: any,
  ) {
    return this.gradesService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.gradesService.remove(id, req.user.establishmentId);
  }
}
