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
import { EnrollmentsService } from './enrollments.service.js';
import { ListEnrollmentsQuery } from './dto/list-enrollments.query.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { BulkCreateEnrollmentsDto } from './dto/bulk-enrollments.dto.js';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.ADMIN)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(@Body() dto: CreateEnrollmentDto, @Request() req: any) {
    return this.enrollmentsService.create(req.user.establishmentId, dto);
  }

  @Post('bulk')
  bulkCreate(@Body() dto: BulkCreateEnrollmentsDto, @Request() req: any) {
    return this.enrollmentsService.bulkCreate(req.user.establishmentId, dto);
  }

  @Get()
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR, Role.TEACHER, Role.STUDENT, Role.PARENT)
  findAll(@Request() req: any, @Query() query: ListEnrollmentsQuery) {
    return this.enrollmentsService.findAll(
      req.user.establishmentId,
      {
        id: req.user.id,
        role: req.user.role,
      },
      query,
    );
  }

  @Get(':id')
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR, Role.TEACHER, Role.STUDENT, Role.PARENT)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.enrollmentsService.findOne(id, req.user.establishmentId, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentDto,
    @Request() req: any,
  ) {
    return this.enrollmentsService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.enrollmentsService.remove(id, req.user.establishmentId);
  }
}
