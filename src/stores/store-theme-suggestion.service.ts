import Anthropic from '@anthropic-ai/sdk';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { sniffImageMime } from '../uploads/image-sniff.js';
import type { SuggestThemeDto } from './dto/suggest-theme.dto.js';
import {
  SUGGEST_THEME_DEFAULT_MODEL,
  SUGGEST_THEME_SYSTEM_PROMPT,
} from './store-theme-suggestion.constants.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_FONTS = new Map<string, string>([
  ['cairo', 'Cairo'],
  ['tajawal', 'Tajawal'],
  ['almarai', 'Almarai'],
]);

export type SuggestThemeResult = {
  primary_color: string;
  accent_color: string;
  highlight_color: string;
  font_family: string;
  reasoning: string;
};

function extractBase64Payload(image: string): string {
  const trimmed = image.trim();
  const m = trimmed.match(/^data:[^;]+;base64,(.+)$/is);
  if (m) return m[1].replace(/\s/g, '');
  return trimmed.replace(/\s/g, '');
}

function extractJsonObject(raw: string): string {
  let t = raw.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  }
  t = t.trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('no json object');
  }
  return t.slice(start, end + 1);
}

function normalizeFont(raw: string): string | null {
  const lower = raw.trim().toLowerCase();
  for (const [key, display] of ALLOWED_FONTS) {
    if (lower.includes(key)) return display;
  }
  return null;
}

/** Normalize model output like "1a2b3c" or "#1A2b3c" to lowercase "#1a2b3c". */
function normalizeHexColor(raw: string): string | null {
  const trimmed = raw.trim().replace(/^['"]+|['"]+$/g, '');
  let body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  body = body.toLowerCase();
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/.test(body)) {
    return null;
  }
  return `#${body}`;
}

@Injectable()
export class StoreThemeSuggestionService {
  private readonly logger = new Logger(StoreThemeSuggestionService.name);

  async suggestFromLogo(dto: SuggestThemeDto): Promise<SuggestThemeResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey?.trim()) {
      this.logger.warn('ANTHROPIC_API_KEY is missing or empty');
      throw new InternalServerErrorException('Failed to analyze logo');
    }

    const model =
      process.env.ANTHROPIC_SUGGEST_THEME_MODEL?.trim() ||
      SUGGEST_THEME_DEFAULT_MODEL;

    const base64 = extractBase64Payload(dto.image);
    const dtoMediaType = dto.mediaType.trim();

    const allowedMime = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ] as const;
    if (!allowedMime.includes(dtoMediaType as (typeof allowedMime)[number])) {
      throw new BadRequestException('Unsupported mediaType');
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch {
      throw new BadRequestException('Invalid base64 image');
    }
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException(
        `Image must decode to at most ${MAX_IMAGE_BYTES} bytes`,
      );
    }

    const sniffed = sniffImageMime(buffer);
    const mediaType =
      sniffed && allowedMime.includes(sniffed as (typeof allowedMime)[number])
        ? sniffed
        : dtoMediaType;
    if (sniffed && sniffed !== dtoMediaType) {
      this.logger.debug(
        `mediaType overridden from declared ${dtoMediaType} to sniffed ${sniffed}`,
      );
    }

    try {
      const client = new Anthropic({ apiKey });

      /** Extended thinking can consume budget and leave empty `text`; disable for deterministic JSON-only replies. */
      const message = await client.messages.create({
        model,
        max_tokens: 300,
        system: SUGGEST_THEME_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as
                    | 'image/png'
                    | 'image/jpeg'
                    | 'image/webp'
                    | 'image/gif',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: 'Analyze this store logo and respond with the JSON object exactly as specified in your instructions.',
              },
            ],
          },
        ],
      });

      const text = message.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { text: string }).text)
        .join('\n')
        .trim();

      if (!text) {
        this.logger.warn(
          `Empty text in Claude response stop_reason=${message.stop_reason} model=${model}`,
        );
        throw new Error('empty assistant text');
      }

      const jsonStr = extractJsonObject(text);
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

      const primary_color = normalizeHexColor(
        String(parsed.primary_color ?? ''),
      );
      const accent_color = normalizeHexColor(String(parsed.accent_color ?? ''));
      const highlight_color = normalizeHexColor(
        String(parsed.highlight_color ?? ''),
      );
      const fontRaw = String(parsed.font_family ?? '').trim();
      const reasoning = String(parsed.reasoning ?? '').trim();

      if (!primary_color || !accent_color || !highlight_color) {
        throw new Error('invalid hex colors after normalize');
      }
      const font_family = normalizeFont(fontRaw);
      if (!font_family || !reasoning) {
        throw new Error('invalid font or reasoning');
      }

      return {
        primary_color,
        accent_color,
        highlight_color,
        font_family,
        reasoning,
      };
    } catch (e) {
      if (e instanceof HttpException) throw e;

      const err = e as Error & { status?: number };
      const msg = err.message ?? String(e);
      const status = typeof err.status === 'number' ? err.status : undefined;
      this.logger.error(
        `suggest-theme failed model=${model} status=${status ?? 'n/a'}: ${msg}`,
        err.stack,
      );

      throw new InternalServerErrorException('Failed to analyze logo');
    }
  }
}
