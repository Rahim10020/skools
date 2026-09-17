import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCycleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string; // Primaire, Collège, Lycée...

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
