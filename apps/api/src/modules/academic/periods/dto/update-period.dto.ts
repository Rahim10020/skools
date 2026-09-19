import { PartialType } from '@nestjs/mapped-types';
import { CreatePeriodDto } from './create-period.dto.js';

export class UpdatePeriodDto extends PartialType(CreatePeriodDto) {}
