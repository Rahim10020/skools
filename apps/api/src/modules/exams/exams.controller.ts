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
} from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  create(@Body() dto: CreateExamDto, @Request() req: any) {
    return this.examsService.create(req.user.establishmentId, dto);
  }

  @Get()
  @Roles(Role.DIRECTOR, Role.CENSEUR, Role.TEACHER)
  findAll(@Request() req: any) {
    return this.examsService.findAll(req.user.establishmentId, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Get(':id')
  @Roles(Role.DIRECTOR, Role.CENSEUR, Role.TEACHER)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.examsService.findOne(id, req.user.establishmentId, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExamDto,
    @Request() req: any,
  ) {
    return this.examsService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.examsService.remove(id, req.user.establishmentId);
  }
}
