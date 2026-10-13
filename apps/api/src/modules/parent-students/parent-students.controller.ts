import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ParentStudentsService } from './parent-students.service.js';
import { LinkParentStudentDto } from './dto/link-parent-student.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('parent-students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DIRECTOR, Role.ADMIN)
export class ParentStudentsController {
  constructor(private readonly parentStudentsService: ParentStudentsService) {}

  @Post()
  link(@Body() dto: LinkParentStudentDto, @Request() req: any) {
    return this.parentStudentsService.link(req.user.establishmentId, dto);
  }

  @Get('my-children')
  @Roles(Role.PARENT)
  findMyChildren(@Request() req: any) {
    return this.parentStudentsService.findMyChildren(
      req.user.id,
      req.user.establishmentId,
    );
  }

  @Get('student/:studentId')
  findByStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Request() req: any,
  ) {
    return this.parentStudentsService.findByStudent(
      studentId,
      req.user.establishmentId,
    );
  }

  @Get('parent/:parentId')
  findByParent(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Request() req: any,
  ) {
    return this.parentStudentsService.findByParent(
      parentId,
      req.user.establishmentId,
    );
  }

  @Delete(':id')
  unlink(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.parentStudentsService.unlink(id, req.user.establishmentId);
  }
}
