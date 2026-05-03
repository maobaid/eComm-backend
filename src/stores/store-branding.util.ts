import type { StoreBrandingFieldsDto } from './dto/store-branding-fields.dto.js';

const BRANDING_KEYS = [
  'primary_color',
  'secondary_color',
  'accent_color',
  'highlight_color',
  'logo_url',
  'font_family',
] as const satisfies readonly (keyof StoreBrandingFieldsDto)[];

export type StoreBrandingKey = (typeof BRANDING_KEYS)[number];

/** Maps optional branding DTO fields to Prisma-ready strings or null (empty string → null). */
export function normalizeStoreBranding(
  dto: Partial<StoreBrandingFieldsDto>,
): Partial<Record<StoreBrandingKey, string | null>> {
  const out: Partial<Record<StoreBrandingKey, string | null>> = {};
  for (const key of BRANDING_KEYS) {
    const v = dto[key];
    if (v === undefined) continue;
    const t = v.trim();
    out[key] = t === '' ? null : t;
  }
  return out;
}
