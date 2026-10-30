import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/libs/api';
import { toastMutationError } from '@/services/helpers';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }));

const STOCK_MESSAGE = 'Not enough stock for variant: 12';

/** Make the next request fail the way the server answers: a status and a JSON body. */
const failWith = (status: number, data: Record<string, unknown>) => {
  apiClient.defaults.adapter = (config: InternalAxiosRequestConfig) =>
    Promise.reject(
      new AxiosError('Request failed', String(status), config, null, {
        status,
        statusText: 'Error',
        headers: {},
        config,
        data,
      }),
    );
};

describe('admin request failure with a message and no field errors', () => {
  beforeEach(() => {
    toastError.mockReset();
  });

  it.each([422, 500])('Status %i: shows the server message in a toast', async (status) => {
    failWith(status, { message: STOCK_MESSAGE, errors: null });

    const error = await apiClient.post('/orders', {}).catch((caught: unknown) => caught);
    toastMutationError(error);

    expect(toastError).toHaveBeenCalledWith(STOCK_MESSAGE);
  });
});
