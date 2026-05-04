import Anthropic from '@anthropic-ai/sdk';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { SuggestThemeDto } from './dto/suggest-theme.dto.js';
import { SUGGEST_THEME_MODEL, SUGGEST_THEME_SYSTEM_PROMPT } from './store-theme-suggestion.constants.js';

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

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

@Injectable()
export class StoreThemeSuggestionService {
  async suggestFromLogo(dto: SuggestThemeDto): Promise<SuggestThemeResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey?.trim()) {
      throw new InternalServerErrorException('Failed to analyze logo');
    }

    const base64 = extractBase64Payload(dto.image);
    const mediaType = dto.mediaType.trim();

    const allowedMime = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
    if (!allowedMime.includes(mediaType as (typeof allowedMime)[number])) {
      throw new BadRequestException('Unsupported mediaType');
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch {
      throw new BadRequestException('Invalid base64 image');
    }
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException(`Image must decode to at most ${MAX_IMAGE_BYTES} bytes`);
    }

    try {
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: SUGGEST_THEME_MODEL,
        max_tokens: 1024,
        system: SUGGEST_THEME_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
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

      const jsonStr = extractJsonObject(text);
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

      const primary_color = String(parsed.primary_color ?? '').trim();
      const accent_color = String(parsed.accent_color ?? '').trim();
      const highlight_color = String(parsed.highlight_color ?? '').trim();
      const fontRaw = String(parsed.font_family ?? '').trim();
      const reasoning = String(parsed.reasoning ?? '').trim();

      if (!HEX_RE.test(primary_color) || !HEX_RE.test(accent_color) || !HEX_RE.test(highlight_color)) {
        throw new Error('invalid hex colors');
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
      throw new InternalServerErrorException('Failed to analyze logo');
    }
  }
}
