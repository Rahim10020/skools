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
import { SeriesService } from './series.service.js';
import { CreateSeriesDto } from './dto/create-series.dto.js';
import { UpdateSeriesDto } from './dto/update-series.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@Controller('series')
@UseGuards(JwtAuthGuard)
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  create(@Body() dto: CreateSeriesDto, @Request() req: any) {
    return this.seriesService.create(req.user.establishmentId, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.seriesService.findAll(req.user.establishmentId);
  }

  @Get(':id')
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
