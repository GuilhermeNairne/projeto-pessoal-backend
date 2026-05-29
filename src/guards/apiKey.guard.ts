import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
// import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip validation for routes marked with @Public()
    // const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);
    // if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.extractKey(request);

    if (!key) {
      throw new UnauthorizedException('API key não informada!');
    }

    const validKeys = (process.env.API_KEY ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (validKeys.length === 0) {
      throw new UnauthorizedException('API key não configurada!');
    }

    if (!validKeys.includes(key)) {
      throw new UnauthorizedException('API KEY inválida!');
    }

    return true;
  }

  private extractKey(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (authHeader) {
      const match = authHeader.match(/^(?:Bearer|ApiKey)\s+(.+)$/i);
      if (match) return match[1].trim();
    }

    const xApiKey = request.headers['x-api-key'];
    if (xApiKey) return String(xApiKey).trim();

    const queryKey = (request.query as Record<string, string>)['api_key'];
    if (queryKey) return String(queryKey).trim();

    return null;
  }
}
