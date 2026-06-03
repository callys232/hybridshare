import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';

// Empty string → relative /api/* (Next.js route handlers on the same origin)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL ? `${BASE_URL}/api` : '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return client(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        if (!refreshToken) {
          processQueue(error);
          isRefreshing = false;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        try {
          const refreshBase = BASE_URL ? `${BASE_URL}/api` : '/api';
          const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
            `${refreshBase}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data!;

          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          processQueue(null, accessToken);
          isRefreshing = false;

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);
          isRefreshing = false;

          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }

          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const api = createApiClient();

export async function apiRequest<T>(
  config: AxiosRequestConfig,
  fallback?: () => T
): Promise<T> {
  try {
    const response = await api.request<ApiResponse<T>>(config);
    if (!response.data.success || response.data.data === null) {
      throw new Error(response.data.error ?? 'Request failed');
    }
    return response.data.data;
  } catch (error) {
    if (fallback) {
      console.warn('API request failed, using mock fallback:', (error as Error).message);
      return fallback();
    }
    throw error;
  }
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error ?? error.message ?? 'Request failed';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
