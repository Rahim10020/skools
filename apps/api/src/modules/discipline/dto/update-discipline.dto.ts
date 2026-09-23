import { PartialType } from '@nestjs/mapped-types';
import { CreateDisciplineDto } from './create-discipline.dto.js';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateDisciplineDto extends PartialType(CreateDisciplineDto) {
  @IsString()
  @IsOptional()
  resolution?: string;

  @IsDateString()
  @IsOptional()
  resolvedAt?: string;
}
