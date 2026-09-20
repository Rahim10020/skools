import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { EstablishmentsService } from './establishments.service.js';
import { CreateEstablishmentDto } from './dto/create-establishment.dto.js';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AuthService } from '../auth/auth.service.js';

@Controller('establishments')
@UseGuards(JwtAuthGuard)
export class EstablishmentsController {
  constructor(
    private readonly establishmentsService: EstablishmentsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(@Body() dto: CreateEstablishmentDto, @Request() req: any) {
    const establishment = await this.establishmentsService.createWithOwner(
      dto,
      req.user.id,
    );

    // On regénère les tokens avec le nouvel establishmentId + rôle
    const tokens = await this.authService['generateTokens'](
      req.user.id,
      req.user.email,
      establishment.id,
      'DIRECTOR',
    );

    return {
      ...establishment,
      ...tokens,
    };
  }

  @Get()
  findAll() {
    return this.establishmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.establishmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEstablishmentDto: UpdateEstablishmentDto,
  ) {
    return this.establishmentsService.update(id, updateEstablishmentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.establishmentsService.remove(id);
  }
}
