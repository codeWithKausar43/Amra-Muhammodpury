import { env } from '@/config/env';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...customConfig } = options;

  const defaultHeaders: Record<string, string> = {};

  // Only set Content-Type: application/json when there is an actual body
  // and the caller didn't pass FormData (where browser must set boundary)
  if (customConfig.body && !(customConfig.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  let normalizedPath = endpoint;
  if (!normalizedPath.startsWith('/api/')) {
    normalizedPath = `/api/v1${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
  }

  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_API_URL}${normalizedPath}`, {
      credentials: 'include', // Include Better Auth session cookies
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      ...customConfig,
    });
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি (Failed to fetch)। ব্যাকএন্ড সার্ভার চালু আছে কিনা নিশ্চিত করুন।',
      0,
      'NETWORK_ERROR',
      { originalError: err?.message, targetUrl: `${env.NEXT_PUBLIC_API_URL}${normalizedPath}` },
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.error?.message || data?.message || response.statusText || 'Network request failed';
    const errorCode = data?.error?.code || 'HTTP_ERROR';
    throw new ApiError(errorMessage, response.status, errorCode, data?.error?.details);
  }

  return data;
}
