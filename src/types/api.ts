export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: ApiMeta;
}

export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}
