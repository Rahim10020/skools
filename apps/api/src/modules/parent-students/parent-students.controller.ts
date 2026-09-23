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
import { ParentStudentsService } from './parent-students.service.js';
import { LinkParentStudentDto } from './dto/link-parent-student.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('parent-students')
@UseGuards(JwtAuthGuard)
export class ParentStudentsController {
  constructor(private readonly parentStudentsService: ParentStudentsService) {}

  @Post()
  link(@Body() dto: LinkParentStudentDto, @Request() req: any) {
    return this.parentStudentsService.link(req.user.establishmentId, dto);
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
