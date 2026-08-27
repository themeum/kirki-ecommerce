import type { AxiosResponse } from 'axios';

import type { ApiErrorPayload, ApiResponse } from '@/types/api/response';
import type { ListParams } from '@/types/list-state';

type BulkActionParams<TFilter extends Record<string, unknown> = Record<string, unknown>> = {
  action?: string;
  ids?: number[] | null;
  params?: ListParams<TFilter>;
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

export type { ApiCallResult, AxiosErrorLike, BulkActionParams };
