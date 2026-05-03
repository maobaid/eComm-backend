import {
  Controller,
  MaxFileSizeValidator,
  ParseFilePipe,
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
import { CUSTOMIZATION_IMAGE_MAX_BYTES } from './constants.js';
import type { MemoryStoredUploadFile } from './memory-upload-file.types.js';
import { StoreLogoUploadService } from './store-logo-upload.service.js';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(ThrottlerGuard)
/** Same IP throttling as other uploads (see ThrottlerModule + env CUSTOMIZATION_UPLOAD_THROTTLE_*). */
export class StoreLogoUploadController {
  constructor(private readonly uploads: StoreLogoUploadService) {}

  @Post('store-logo')
  @ApiOperation({
    summary: 'Upload store logo before a store exists (multipart, no storeId)',
    description:
      'Use during signup: returns `url` for `register-store` / `PATCH .../theme` `logo_url`. Configure STORE_LOGO_UPLOAD_PUBLIC_BASE_URL and STORE_LOGO_UPLOAD_DIR.',
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
    schema: { example: { url: 'https://example.com/public/store-logo-uploads/uuid.png' } },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: CUSTOMIZATION_IMAGE_MAX_BYTES } }),
  )
  uploadStoreLogo(
    @UploadedFile(
      new ParseFilePipe({
        errorHttpStatusCode: 400,
        fileIsRequired: true,
        validators: [new MaxFileSizeValidator({ maxSize: CUSTOMIZATION_IMAGE_MAX_BYTES })],
      }),
    )
    file: MemoryStoredUploadFile,
  ) {
    return this.uploads.uploadLogo(file);
  }
}
