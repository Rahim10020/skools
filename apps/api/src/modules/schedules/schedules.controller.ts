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
import { SchedulesService } from './schedules.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  create(@Body() dto: CreateScheduleDto, @Request() req: any) {
    return this.schedulesService.create(req.user.establishmentId, dto);
  }

  @Get()
  @Roles(
    Role.DIRECTOR,
    Role.ADMIN,
    Role.CENSEUR,
    Role.SURVEILLANT,
    Role.TEACHER,
    Role.STUDENT,
    Role.PARENT,
  )
  findAll(@Request() req: any, @Query('classroomId') classroomId?: string) {
    return this.schedulesService.findAll(req.user.establishmentId, classroomId);
  }

  @Get(':id')
  @Roles(
    Role.DIRECTOR,
    Role.ADMIN,
    Role.CENSEUR,
    Role.SURVEILLANT,
    Role.TEACHER,
    Role.STUDENT,
    Role.PARENT,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.schedulesService.findOne(id, req.user.establishmentId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleDto,
    @Request() req: any,
  ) {
    return this.schedulesService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.schedulesService.remove(id, req.user.establishmentId);
  }
}
