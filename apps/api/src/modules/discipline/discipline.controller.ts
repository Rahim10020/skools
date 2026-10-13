import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { DisciplineService } from './discipline.service.js';
import { CreateDisciplineDto } from './dto/create-discipline.dto.js';
import { UpdateDisciplineDto } from './dto/update-discipline.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('discipline')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.CENSEUR, Role.SURVEILLANT)
export class DisciplineController {
  constructor(private readonly disciplineService: DisciplineService) {}

  @Post()
  create(@Body() dto: CreateDisciplineDto, @Request() req: any) {
    return this.disciplineService.create(
      req.user.establishmentId,
      req.user.id,
      dto,
    );
  }

  @Get()
  @Roles(
    Role.DIRECTOR,
    Role.CENSEUR,
    Role.SURVEILLANT,
    Role.STUDENT,
    Role.PARENT,
  )
  findAll(@Request() req: any, @Query('studentId') studentId?: string) {
    return this.disciplineService.findAll(req.user.establishmentId, studentId, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.disciplineService.findOne(id, req.user.establishmentId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisciplineDto,
    @Request() req: any,
  ) {
    return this.disciplineService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.disciplineService.remove(id, req.user.establishmentId);
  }
}
