import { BadRequestException } from '@nestjs/common';

export type ProductCustomizationDef = {
  id: string;
  label: string;
  kind: 'TEXT' | 'IMAGE';
  required: boolean;
  max_chars: number | null;
  text_mode: 'SINGLE_WORD' | 'SENTENCE' | null;
  sort_order: number;
};

export type CustomizationSnapshot = {
  label_snapshot: string;
  kind: 'TEXT' | 'IMAGE';
  text_mode: 'SINGLE_WORD' | 'SENTENCE' | null;
  text_value: string | null;
  image_url: string | null;
};

export type SubmittedCustomization = {
  product_customization_id: string;
  text_value?: string | null;
  image_url?: string | null;
};

/** Validates against live product definition; returns rows to persist as snapshots on the order line. */
export function validateAndBuildCustomizationSnapshots(
  productId: string,
  definitions: ProductCustomizationDef[],
  submitted: SubmittedCustomization[] | undefined,
): CustomizationSnapshot[] {
  const byDefId = new Map(definitions.map((d) => [d.id, d]));
  const values = submitted ?? [];
  const incomingIds = values.map((v) => v.product_customization_id);
  if (incomingIds.length !== new Set(incomingIds).size) {
    throw new BadRequestException(`Duplicate customization ids for product ${productId}`);
  }

  for (const v of values) {
    if (!byDefId.has(v.product_customization_id)) {
      throw new BadRequestException(
        `Unknown product_customization_id ${v.product_customization_id} for product ${productId}`,
      );
    }
  }

  for (const def of definitions) {
    if (!def.required) continue;
    const v = values.find((x) => x.product_customization_id === def.id);
    if (!v) {
      throw new BadRequestException(`Missing required customization "${def.label}" for product ${productId}`);
    }
    if (def.kind === 'TEXT') {
      const text = (v.text_value ?? '').trim();
      if (!text) {
        throw new BadRequestException(`Customization "${def.label}" text is required`);
      }
    } else {
      const url = (v.image_url ?? '').trim();
      if (!url) {
        throw new BadRequestException(`Customization "${def.label}" image is required`);
      }
    }
  }

  const orderedDefs = [...definitions].sort((a, b) => a.sort_order - b.sort_order);
  const snapshots: CustomizationSnapshot[] = [];

  for (const def of orderedDefs) {
    const v = values.find((x) => x.product_customization_id === def.id);
    if (!v) continue;

    if (def.kind === 'TEXT') {
      if (v.image_url != null && String(v.image_url).trim() !== '') {
        throw new BadRequestException(`Customization "${def.label}" must not include image_url`);
      }
      const text = (v.text_value ?? '').trim();
      if (!text) {
        continue;
      }
      if (def.max_chars == null || def.text_mode == null) {
        throw new BadRequestException(`Customization "${def.label}" is misconfigured for TEXT`);
      }
      const max = def.max_chars;
      if (text.length > max) {
        throw new BadRequestException(`Customization "${def.label}" exceeds ${max} characters`);
      }
      if (def.text_mode === 'SINGLE_WORD' && /\s/.test(text)) {
        throw new BadRequestException(`Customization "${def.label}" must be a single word (no spaces)`);
      }
      if (def.text_mode === 'SENTENCE' && !/\S/.test(text)) {
        throw new BadRequestException(`Customization "${def.label}" text is empty`);
      }
      snapshots.push({
        label_snapshot: def.label,
        kind: 'TEXT',
        text_mode: def.text_mode,
        text_value: text,
        image_url: null,
      });
    } else {
      if (v.text_value != null && String(v.text_value).trim() !== '') {
        throw new BadRequestException(`Customization "${def.label}" must not include text_value`);
      }
      const url = (v.image_url ?? '').trim();
      if (!url) {
        continue;
      }
      try {
        const u = new URL(url);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          throw new BadRequestException(`Customization "${def.label}" image_url must be http(s)`);
        }
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        throw new BadRequestException(`Customization "${def.label}" image_url must be a valid URL`);
      }
      snapshots.push({
        label_snapshot: def.label,
        kind: 'IMAGE',
        text_mode: null,
        text_value: null,
        image_url: url,
      });
    }
  }

  return snapshots;
}
