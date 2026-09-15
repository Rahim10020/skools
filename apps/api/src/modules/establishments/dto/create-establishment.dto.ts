import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EstablishmentType } from '@prisma/client';

export class CreateEstablishmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  slug: string;

  @IsEnum(EstablishmentType)
  @IsOptional()
  type?: EstablishmentType;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}
