import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EstablishmentsService } from './establishments.service.js';
import { EstablishmentsController } from './establishments.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [EstablishmentsController],
  providers: [EstablishmentsService],
  exports: [EstablishmentsService],
})
export class EstablishmentsModule {}
