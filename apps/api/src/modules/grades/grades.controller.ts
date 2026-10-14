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
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.TEACHER)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  create(@Body() dto: CreateGradeDto, @Request() req: any) {
    return this.gradesService.create(req.user.establishmentId, dto, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Post('bulk')
  bulkCreate(@Body() dto: BulkGradesDto, @Request() req: any) {
    return this.gradesService.bulkCreate(req.user.establishmentId, dto, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Get()
  @Roles(Role.DIRECTOR, Role.CENSEUR, Role.TEACHER)
  findAll(@Request() req: any, @Query('examId') examId?: string) {
    const actor = { id: req.user.id, role: req.user.role };
    if (examId) {
      return this.gradesService.findByExam(examId, req.user.establishmentId, actor);
    }
    return this.gradesService.findAll(req.user.establishmentId, actor);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeDto,
    @Request() req: any,
  ) {
    return this.gradesService.update(id, req.user.establishmentId, dto, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.gradesService.remove(id, req.user.establishmentId, {
      id: req.user.id,
      role: req.user.role,
    });
  }
}
