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
import { Role } from '@prisma/client';
import { StudentsService } from './students.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { ListStudentsQuery } from './dto/list-students.query.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.ADMIN)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() dto: CreateStudentDto, @Request() req: any) {
    return this.studentsService.create(req.user.establishmentId, dto);
  }

  @Get()
  @Roles(
    Role.DIRECTOR,
    Role.ADMIN,
    Role.CENSEUR,
    Role.SURVEILLANT,
    Role.BIBLIOTECAIRE,
  )
  findAll(@Request() req: any, @Query() query: ListStudentsQuery) {
    return this.studentsService.findAll(req.user.establishmentId, query);
  }

  // Avant '/:id' : sinon 'me' est capturé comme UUID invalide (400).
  @Get('me')
  @Roles(Role.STUDENT)
  findMe(@Request() req: any) {
    return this.studentsService.findByUserId(
      req.user.id,
      req.user.establishmentId,
    );
  }

  @Get(':id')
  @Roles(
    Role.DIRECTOR,
    Role.ADMIN,
    Role.CENSEUR,
    Role.SURVEILLANT,
    Role.BIBLIOTECAIRE,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.studentsService.findOne(id, req.user.establishmentId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
    @Request() req: any,
  ) {
    return this.studentsService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.studentsService.remove(id, req.user.establishmentId);
  }
}
