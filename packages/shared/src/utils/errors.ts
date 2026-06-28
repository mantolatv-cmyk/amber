/**
 * Custom Application Errors
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Common error factory functions
 */
export const Errors = {
  notFound: (entity: string, id?: string) =>
    new AppError(
      `${entity.toUpperCase()}_NOT_FOUND`,
      404,
      id ? `${entity} with id '${id}' not found` : `${entity} not found`,
    ),

  forbidden: (message?: string) =>
    new AppError('FORBIDDEN', 403, message ?? 'You do not have permission to perform this action'),

  invalidStateTransition: (currentStatus: string, event?: string) =>
    new AppError(
      'INVALID_STATE_TRANSITION',
      422,
      event
        ? `Cannot apply event '${event}' to entity in status '${currentStatus}'`
        : `Invalid state transition from '${currentStatus}'`,
    ),

  slotConflict: () =>
    new AppError(
      'SLOT_CONFLICT',
      409,
      'The requested time slot conflicts with an existing session',
    ),

  concurrentModification: () =>
    new AppError(
      'CONCURRENT_MODIFICATION',
      409,
      'The resource was modified by another operation. Please retry.',
    ),

  paymentFailed: (reason?: string) =>
    new AppError('PAYMENT_FAILED', 402, reason ?? 'Payment processing failed'),

  validationError: (details: Record<string, unknown>) =>
    new AppError('VALIDATION_ERROR', 400, 'Request validation failed', details),

  tooEarly: (message?: string) =>
    new AppError('TOO_EARLY', 422, message ?? 'Action attempted too early'),

  serviceUnavailable: (service: string) =>
    new AppError(
      'SERVICE_UNAVAILABLE',
      503,
      `External service '${service}' is currently unavailable`,
    ),
} as const;
