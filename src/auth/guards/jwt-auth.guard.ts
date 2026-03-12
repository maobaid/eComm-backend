import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser | false, info: Error | null): TUser {
    if (err || !user) {
      const reason = err?.message ?? info?.message ?? (user === false ? 'token invalid or missing' : 'unknown');
      console.log('[JwtAuthGuard] DENY:', { reason, err: err?.message, info: info?.message });
      throw err ?? new UnauthorizedException(reason);
    }
    return user;
  }
}
