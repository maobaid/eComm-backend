import {
  Controller,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { CustomizationImageUploadService } from './customization-image-upload.service.js';
import { CUSTOMIZATION_IMAGE_MAX_BYTES } from './constants.js';

@ApiTags('Uploads')
@Controller('stores/:storeId')
@UseGuards(ThrottlerGuard)
/** IP-based rate limiting (see ThrottlerModule + env CUSTOMIZATION_UPLOAD_THROTTLE_*). */
export class CustomizationImageUploadController {
  constructor(private readonly uploads: CustomizationImageUploadService) {}

  @Post('customization-uploads/image')
  @ApiOperation({
    summary: 'Upload customization image file (multipart); returns URL for order checkout image_url',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({
    schema: { example: { url: 'https://example.com/public/customization-uploads/store-id/name.jpg' } },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: CUSTOMIZATION_IMAGE_MAX_BYTES } }),
  )
  uploadImage(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @UploadedFile(
      new ParseFilePipe({
        errorHttpStatusCode: 400,
        fileIsRequired: true,
        validators: [new MaxFileSizeValidator({ maxSize: CUSTOMIZATION_IMAGE_MAX_BYTES })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploads.uploadImage(storeId, file);
  }
}
