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
import { Role } from '@prisma/client';
import { UserEstablishmentsService } from './user-establishments.service.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('user-establishments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR)
export class UserEstablishmentsController {
  constructor(
    private readonly userEstablishmentsService: UserEstablishmentsService,
  ) {}

  @Get()
  findMembers(@Request() req: any) {
    return this.userEstablishmentsService.findMembers(
      req.user.establishmentId,
    );
  }

  @Post()
  addMember(@Body() dto: AddMemberDto, @Request() req: any) {
    return this.userEstablishmentsService.addMember(
      req.user.establishmentId,
      dto,
    );
  }

  @Patch(':id')
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberRoleDto,
    @Request() req: any,
  ) {
    return this.userEstablishmentsService.updateRole(
      req.user.establishmentId,
      req.user.id,
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.userEstablishmentsService.remove(
      req.user.establishmentId,
      req.user.id,
      id,
    );
  }
}
