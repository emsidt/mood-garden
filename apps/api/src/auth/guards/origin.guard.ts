import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
// Custom header blocks cross-origin form submissions; Origin is checked for browser clients.
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.headers['x-mood-garden'] !== '1' ||
      (req.headers.origin && req.headers.origin !== this.config.getOrThrow('FRONTEND_ORIGIN') &&
       req.headers.origin !== this.config.getOrThrow('API_ORIGIN')))
      throw new ForbiddenException('Nguồn yêu cầu không hợp lệ.');
    return true;
  }
}
