import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

function toWhatsappAddress(phone: string): string {
  const trimmed = phone.replace(/\s/g, '');
  if (trimmed.toLowerCase().startsWith('whatsapp:')) {
    return trimmed;
  }
  const e164 = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  return `whatsapp:${e164}`;
}

function normalizeWhatsappFrom(from: string): string {
  const trimmed = from.replace(/\s/g, '');
  if (trimmed.toLowerCase().startsWith('whatsapp:')) {
    return trimmed;
  }
  const e164 = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  return `whatsapp:${e164}`;
}

@Injectable()
export class OrderWhatsappService {
  private readonly logger = new Logger(OrderWhatsappService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendReceipt(params: {
    toPhoneNumber: string;
    mediaUrl: string;
    caption: string;
  }): Promise<{ messageId: string | null }> {
    const enabled =
      this.configService.get<string>('TWILIO_ENABLED') === 'true' ||
      this.configService.get<string>('WHATSAPP_ENABLED') === 'true';

    if (!enabled) {
      this.logger.warn('Twilio WhatsApp disabled (set TWILIO_ENABLED=true).');
      return { messageId: null };
    }

    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const fromRaw = this.configService.get<string>('TWILIO_WHATSAPP_FROM');

    if (!accountSid || !authToken || !fromRaw) {
      throw new Error(
        'Missing Twilio config: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_FROM',
      );
    }

    const client = twilio(accountSid, authToken);
    const from = normalizeWhatsappFrom(fromRaw);
    const to = toWhatsappAddress(params.toPhoneNumber);

    const message = await client.messages.create({
      from,
      to,
      body: params.caption,
      mediaUrl: [params.mediaUrl],
    });

    this.logger.log(`Twilio WhatsApp receipt sent to ${to} (sid=${message.sid})`);
    return { messageId: message.sid };
  }
}
