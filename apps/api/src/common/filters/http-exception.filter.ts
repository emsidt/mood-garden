import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const detail = exception instanceof HttpException ? exception.getResponse() : null;
    if (status >= 500) this.logger.error(exception instanceof Error ? exception.stack : 'Unexpected server error');
    response.status(status).json({
      statusCode: status,
      ...(typeof detail === 'object' && detail !== null
        ? detail
        : { message: detail ?? 'Internal server error', error: status === 500 ? 'Internal Server Error' : 'Request Error' }),
    });
  }
}
