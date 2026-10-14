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
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { AuthService } from '../auth/auth.service.js';

@Controller('establishments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.ADMIN)
export class EstablishmentsController {
  constructor(
    private readonly establishmentsService: EstablishmentsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @Roles()
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
  findAll(@Request() req: any) {
    return this.establishmentsService.findAll(req.user.establishmentId);
  }

  @Get(':id')
  @Roles(Role.DIRECTOR, Role.ADMIN, Role.CENSEUR)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.establishmentsService.findOne(id, req.user.establishmentId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEstablishmentDto: UpdateEstablishmentDto,
    @Request() req: any,
  ) {
    return this.establishmentsService.update(
      id,
      req.user.establishmentId,
      updateEstablishmentDto,
    );
  }

  @Delete(':id')
  @Roles(Role.DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.establishmentsService.remove(id, req.user.establishmentId);
  }
}
