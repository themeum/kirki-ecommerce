import type { ApiCallResult, ApiResponse } from '@/types';

const isApiSuccess = <T,>(
  result: ApiCallResult<T>,
): result is ApiResponse<T> & { success: true; data: T } =>
  typeof result === 'object' &&
  result !== null &&
  'success' in result &&
  (result as ApiResponse<T>).success === true;

export { isApiSuccess };
