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
import { LevelsService } from './levels.service.js';
import { CreateLevelDto } from './dto/create-level.dto.js';
import { UpdateLevelDto } from './dto/update-level.dto.js';
import { ListLevelsQuery } from './dto/list-levels.query.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('levels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.ADMIN)
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Post()
  create(@Body() dto: CreateLevelDto, @Request() req: any) {
    return this.levelsService.create(req.user.establishmentId, dto);
  }

  @Get()
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR)
  findAll(@Request() req: any, @Query() query: ListLevelsQuery) {
    return this.levelsService.findAll(req.user.establishmentId, query);
  }

  @Get(':id')
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.levelsService.findOne(id, req.user.establishmentId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLevelDto,
    @Request() req: any,
  ) {
    return this.levelsService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.levelsService.remove(id, req.user.establishmentId);
  }
}
