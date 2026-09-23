import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto.js';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}
