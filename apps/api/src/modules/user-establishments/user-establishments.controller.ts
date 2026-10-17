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
import { Role } from '@prisma/client';
import { UserEstablishmentsService } from './user-establishments.service.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { ListMembersQuery } from './dto/list-members.query.js';
import { LookupAccountsQuery } from './dto/lookup-accounts.query.js';
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
  findMembers(@Request() req: any, @Query() query: ListMembersQuery) {
    return this.userEstablishmentsService.findMembers(
      req.user.establishmentId,
      query,
    );
  }

  /** Lecture élargie à ADMIN : alimente les sélecteurs de liaison de dossier. */
  @Get('lookup')
  @Roles(Role.DIRECTOR, Role.ADMIN)
  lookupAccounts(@Request() req: any, @Query() query: LookupAccountsQuery) {
    return this.userEstablishmentsService.lookupAccounts(
      req.user.establishmentId,
      query,
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
