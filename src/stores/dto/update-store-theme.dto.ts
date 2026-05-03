import { StoreBrandingFieldsDto } from './store-branding-fields.dto.js';

/**
 * Partial theme update; omit a field to leave it unchanged.
 * Send empty string to clear a nullable field.
 */
export class UpdateStoreThemeDto extends StoreBrandingFieldsDto {}
