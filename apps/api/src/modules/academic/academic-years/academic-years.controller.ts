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
import { AcademicYearsService } from './academic-years.service.js';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto.js';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('academic-years')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.ADMIN)
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  create(@Body() dto: CreateAcademicYearDto, @Request() req: any) {
    // Pour l’instant on récupère le premier établissement de l’utilisateur.
    // Plus tard on gérera le contexte d’établissement courant.
    const establishmentId = req.user.establishmentId;
    return this.academicYearsService.create(establishmentId, dto);
  }

  @Get()
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR)
  findAll(@Request() req: any) {
    const establishmentId = req.user.establishmentId;
    return this.academicYearsService.findAll(establishmentId);
  }

  @Get(':id')
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.academicYearsService.findOne(id, req.user.establishmentId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicYearDto,
    @Request() req: any,
  ) {
    return this.academicYearsService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.academicYearsService.remove(id, req.user.establishmentId);
  }
}
