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
import { SeriesService } from './series.service.js';
import { CreateSeriesDto } from './dto/create-series.dto.js';
import { UpdateSeriesDto } from './dto/update-series.dto.js';
import { ListSeriesQuery } from './dto/list-series.query.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('series')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.ADMIN)
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  create(@Body() dto: CreateSeriesDto, @Request() req: any) {
    return this.seriesService.create(req.user.establishmentId, dto);
  }

  @Get()
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR)
  findAll(@Request() req: any, @Query() query: ListSeriesQuery) {
    return this.seriesService.findAll(req.user.establishmentId, query);
  }

  @Get(':id')
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.seriesService.findOne(id, req.user.establishmentId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSeriesDto,
    @Request() req: any,
  ) {
    return this.seriesService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.seriesService.remove(id, req.user.establishmentId);
  }
}
