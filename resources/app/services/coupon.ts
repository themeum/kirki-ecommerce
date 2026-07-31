import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { CouponListItemSchema, CouponSchema } from '@/schemas/catalog/coupon';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, toastMutationError, toastMutationSuccess, unwrapResponse } from '@/services/helpers';
import { BulkActionParams, ListParams } from '@/types';
import { CouponListFilter } from '@/types/filters/coupon';
import { __ } from '@/wpi18n';

const getCoupons = (params: ListParams<CouponListFilter> = {}) =>
  apiClient
    .get(endpoints.COUPONS, { params })
    .then((response) => parseData(PaginatedDataSchema(CouponListItemSchema), response));

const useCouponsQuery = (params: ListParams<CouponListFilter> = {}) =>
  useQuery({
    queryKey: queryKeys.Coupons(params),
    queryFn: () => getCoupons(params),
    placeholderData: keepPreviousData,
  });

const getCoupon = (id: string | number) => {
  return apiClient
    .get(endpoints.COUPON(id))
    .then((response) => parseData(CouponSchema, response));
};

const useCouponQuery = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.Coupon(id),
    queryFn: () => getCoupon(id),
    enabled: enabled && Boolean(id) && id !== 'create',
  });
};

const bulkDeleteCoupons = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.COUPONS_BULK, { action, ids })
    .then((response) => unwrapResponse(response));
};


const useBulkDeleteCouponsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteCoupons,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Coupons deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Coupons'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  useBulkDeleteCouponsMutation, useCouponQuery,
  useCouponsQuery
};

