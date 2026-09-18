import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string; // A, C, D, S, L...

  @IsUUID()
  @IsOptional()
  levelId?: string;
}
