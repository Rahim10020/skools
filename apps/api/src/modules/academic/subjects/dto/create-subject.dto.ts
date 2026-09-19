import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  code?: string; // MATH, FR, HG...

  @IsString()
  @IsOptional()
  description?: string;
}
