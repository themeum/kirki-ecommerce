type ApiResponseMeta = {
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
  success?: boolean;
  meta?: ApiResponseMeta;
};

type PaginatedData<T> = {
  results: T[];
  total: number;
  per_page: number;
  current_page?: number;
  last_page?: number;
  from?: number;
  has_more_pages?: boolean;
};

type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
  code?: string | number;
};

type ApiError = {
  response?: {
    data?: ApiErrorPayload;
    status?: number;
    statusText?: string;
  };
  message?: string;
};

export type {
  ApiResponse,
  ApiResponseMeta,
  PaginatedData,
  PaginatedResponse,
  ApiError,
  ApiErrorPayload,
};
