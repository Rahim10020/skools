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
import { CyclesService } from './cycles.service.js';
import { CreateCycleDto } from './dto/create-cycle.dto.js';
import { UpdateCycleDto } from './dto/update-cycle.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('cycles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.ADMIN)
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Post()
  create(@Body() dto: CreateCycleDto, @Request() req: any) {
    return this.cyclesService.create(req.user.establishmentId, dto);
  }

  @Get()
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR)
  findAll(@Request() req: any) {
    return this.cyclesService.findAll(req.user.establishmentId);
  }

  @Get(':id')
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.cyclesService.findOne(id, req.user.establishmentId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCycleDto,
    @Request() req: any,
  ) {
    return this.cyclesService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.cyclesService.remove(id, req.user.establishmentId);
  }
}
