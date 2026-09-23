import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ParentRelation } from '@prisma/client';

export class LinkParentStudentDto {
  @IsUUID()
  parentId: string;

  @IsUUID()
  studentId: string;

  @IsEnum(ParentRelation)
  @IsOptional()
  relation?: ParentRelation;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
