import { Module } from '@nestjs/common';
import { UserEstablishmentsService } from './user-establishments.service.js';
import { UserEstablishmentsController } from './user-establishments.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [UserEstablishmentsController],
  providers: [UserEstablishmentsService],
  exports: [UserEstablishmentsService],
})
export class UserEstablishmentsModule {}
