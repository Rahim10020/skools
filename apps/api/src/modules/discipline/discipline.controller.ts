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
import { DisciplineService } from './discipline.service.js';
import { CreateDisciplineDto } from './dto/create-discipline.dto.js';
import { UpdateDisciplineDto } from './dto/update-discipline.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('discipline')
@UseGuards(JwtAuthGuard)
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
  findAll(@Request() req: any, @Query('studentId') studentId?: string) {
    if (studentId) {
      return this.disciplineService.findByStudent(
        studentId,
        req.user.establishmentId,
      );
    }
    return this.disciplineService.findAll(req.user.establishmentId);
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
