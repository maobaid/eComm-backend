import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../constants.js';

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: UserRole;
  store_id: string | null;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
