import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CustomizationImageUploadController } from './customization-image-upload.controller.js';
import { CustomizationImageUploadService } from './customization-image-upload.service.js';
import { StoreLogoUploadController } from './store-logo-upload.controller.js';
import { StoreLogoUploadService } from './store-logo-upload.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CustomizationImageUploadController, StoreLogoUploadController],
  providers: [CustomizationImageUploadService, StoreLogoUploadService],
})
export class UploadsModule {}
