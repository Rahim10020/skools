import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { EstablishmentsModule } from './modules/establishments/establishments.module.js';

@Module({
  imports: [PrismaModule, EstablishmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
