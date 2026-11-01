export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    timestamp: string;
  };
}

export const successResponse = <T>(
  data?: T,
  message?: string,
  meta?: Omit<NonNullable<ApiResponse<T>['meta']>, 'timestamp'>,
): ApiResponse<T> => ({
  success: true,
  ...(message && { message }),
  ...(data !== undefined && { data }),
  meta: {
    ...meta,
    timestamp: new Date().toISOString(),
  },
});

export const errorResponse = (
  message: string,
  code = 'ERROR',
  details?: unknown,
): ApiResponse<never> => ({
  success: false,
  error: {
    code,
    message,
    ...(details !== undefined && { details }),
  },
  meta: {
    timestamp: new Date().toISOString(),
  },
});
