import type { AxiosResponse } from 'axios';

import type { ApiErrorPayload, ApiResponse } from '@/types/api/response';

type BulkActionParams = {
  action?: string;
  ids?: number[] | null;
};

type ApiCallResult<T = unknown> =
  | false
  | ApiResponse<T>
  | ApiErrorPayload;

type AxiosErrorLike = {
  response?: AxiosResponse<ApiErrorPayload> & {
    data?: ApiErrorPayload;
  };
  message?: string;
};

export type { BulkActionParams, ApiCallResult, AxiosErrorLike };
