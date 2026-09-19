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
import { PeriodsService } from './periods.service.js';
import { CreatePeriodDto } from './dto/create-period.dto.js';
import { UpdatePeriodDto } from './dto/update-period.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@Controller('periods')
@UseGuards(JwtAuthGuard)
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Post()
  create(@Body() dto: CreatePeriodDto, @Request() req: any) {
    return this.periodsService.create(req.user.establishmentId, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.periodsService.findAll(req.user.establishmentId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.periodsService.findOne(id, req.user.establishmentId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePeriodDto,
    @Request() req: any,
  ) {
    return this.periodsService.update(id, req.user.establishmentId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.periodsService.remove(id, req.user.establishmentId);
  }
}