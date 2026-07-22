export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
};

export interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  _retry?: boolean;
}

export type RequestInterceptor = (url: string, config: RequestOptions) => RequestOptions | Promise<RequestOptions>;
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

export const requestInterceptors: RequestInterceptor[] = [];
export const responseInterceptors: ResponseInterceptor[] = [];

let refreshPromise: Promise<string> | null = null;

// Reset refresh state on logout so re-login starts fresh
if (typeof window !== 'undefined') {
  window.addEventListener('auth-logout', () => {
    refreshPromise = null;
  });
}

export async function apiClient<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  let url = path.startsWith('http') ? path : `${baseUrl}${path}`;

  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  let config: RequestOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // 1. Inject Authorization header if we have an accessToken stored
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token && !(config.headers as Record<string, string>)['Authorization']) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  // 2. Run request interceptors
  for (const interceptor of requestInterceptors) {
    config = await interceptor(url, config);
  }

  let response: Response;
  try {
    response = await fetch(url, config);
    console.log('[apiClient] Request to:', url, 'returned status:', response.status);
  } catch (err) {
    console.error('[apiClient] Request to:', url, 'failed with network error:', err);
    throw new ApiError(err instanceof Error ? err.message : 'Network error', 0);
  }

  // 3. Run response interceptors
  for (const interceptor of responseInterceptors) {
    response = await interceptor(response);
  }

  // 4. Handle 401 response and attempt token refresh
  if (response.status === 401 && !config._retry && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
    config._retry = true;

    if (typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              });

              if (!refreshRes.ok) {
                throw new Error('Refresh failed');
              }

              const refreshJson = await refreshRes.json();
              const newAccessToken = refreshJson.data?.accessToken;
              const newRefreshToken = refreshJson.data?.refreshToken;

              if (!newAccessToken) {
                throw new Error('No access token in refresh response');
              }

              localStorage.setItem('accessToken', newAccessToken);
              localStorage.setItem('token', newAccessToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }
              return newAccessToken;
            } catch (_refreshErr) {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              refreshPromise = null;
              window.dispatchEvent(new CustomEvent('auth-logout'));
              throw new ApiError('Session expired. Please log in again.', 401, 'UNAUTHORIZED_EXPIRED');
            }
          })();
        }

        const newToken = await refreshPromise;
        const retryHeaders = {
          ...config.headers,
          'Authorization': `Bearer ${newToken}`
        };
        const retryRes = await fetch(url, { ...config, headers: retryHeaders });
        return handleResponse<T>(retryRes);
      }
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T = unknown>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  let json: { data?: T; error?: { message?: string; code?: string; details?: unknown } } | null = null;
  if (contentType && contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      // Ignore parse failure
    }
  }

  if (!response.ok) {
    if (json && json.error) {
      throw new ApiError(
        json.error.message || 'API Error',
        response.status,
        json.error.code,
        json.error.details
      );
    }
    throw new ApiError(response.statusText || 'API Error', response.status);
  }

  if (json && json.data !== undefined) {
    return json.data;
  }
  return json as unknown as T;
}

apiClient.get = <T = unknown>(path: string, options?: RequestOptions) => 
  apiClient<T>(path, { ...options, method: 'GET' });

apiClient.post = <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => 
  apiClient<T>(path, { 
    ...options, 
    method: 'POST', 
    body: body !== undefined ? JSON.stringify(body) : undefined 
  });

apiClient.put = <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => 
  apiClient<T>(path, { 
    ...options, 
    method: 'PUT', 
    body: body !== undefined ? JSON.stringify(body) : undefined 
  });

apiClient.patch = <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => 
  apiClient<T>(path, { 
    ...options, 
    method: 'PATCH', 
    body: body !== undefined ? JSON.stringify(body) : undefined 
  });

apiClient.delete = <T = unknown>(path: string, options?: RequestOptions) => 
  apiClient<T>(path, { ...options, method: 'DELETE' });
