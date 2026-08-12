import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/config/endpoints';
import type { CouponListFilter } from '@/features/coupons/index';
import { couponKeys } from '@/features/coupons/index';
import { CouponListItemSchema, CouponSchema } from '@/features/coupons/schemas/catalog/coupon';
import type { CouponFormPayload } from '@/features/coupons/schemas/forms/coupon-form';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { BulkActionParams } from '@/types/api/result';
import type { ListParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const getCoupons = (params: ListParams<CouponListFilter> = {}) =>
  apiClient
    .get(endpoints.COUPONS, { params })
    .then((response) => parseData(PaginatedDataSchema(CouponListItemSchema), response));

const useCouponsQuery = (params: ListParams<CouponListFilter> = {}) =>
  useQuery({
    queryKey: couponKeys.list(params),
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
    queryKey: couponKeys.detail(id),
    queryFn: () => getCoupon(id),
    enabled: enabled && Boolean(id) && id !== 'create',
  });
};

const createCoupon = (data: CouponFormPayload) => {
  return apiClient
    .post(endpoints.COUPONS, data)
    .then((response) => parseResponse(CouponSchema, response));
};

const updateCoupon = ({ id, data }: { id: number; data: CouponFormPayload }) => {
  return apiClient
    .put(endpoints.COUPON(id), data)
    .then((response) => parseResponse(CouponSchema, response));
};

const useCreateCouponMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCoupon,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Coupon created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateCouponMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCoupon,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
        __('Coupon updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: couponKeys.detail(variables.id),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const couponAction = ({ id, action }: { id: number; action: 'activate' | 'deactivate' | 'duplicate' }) => {
  return apiClient
    .patch(endpoints.COUPON_ACTION(id), { action })
    .then((response) => {
      return parseResponse(CouponSchema, response);
    });
}

const useCouponActionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: couponAction,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
        __('Coupon updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: couponKeys.detail(variables.id),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
}

const deleteCoupon = (id: number) => {
  return apiClient
    .delete(endpoints.COUPON(id))
    .then((response) => parseMessage(response));
}

const useDeleteCouponMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCoupon,
    onSuccess(response, id) {
      toastMutationSuccess(
        response.message ||
        __('Coupon deleted successfully.', 'kirki-ecommerce'),
      );

      void queryClient.invalidateQueries({ queryKey: couponKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
}

const bulkDeleteCoupons = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.COUPONS_BULK, { action, ids })
    .then((response) => parseMessage(response));
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
      void queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const validateCode = (code: string) => {
  return apiClient
    .get(endpoints.COUPON('validate'), { params: { code } })
    .then((response) => parseResponse(z.boolean(), response));
};

const useValidateQuery = (code: string, enabled = true) =>
  useQuery({
    queryKey: couponKeys.validate(code),
    queryFn: () => validateCode(code),
    enabled: enabled && Boolean(code),
    placeholderData: keepPreviousData,
  });

const generateNewCode = () => {
  return apiClient
    .get(endpoints.COUPON('generate-new-code'))
    .then((response) => parseResponse(z.string(), response));
};

const useGenerateNewCodeQuery = () =>
  useQuery({
    queryKey: couponKeys.newCode(),
    queryFn: () => generateNewCode(),
    enabled: false,
    staleTime: 0,
  });

export {
  useBulkDeleteCouponsMutation, useCouponActionMutation, useCouponQuery,
  useCouponsQuery,
  useCreateCouponMutation, useDeleteCouponMutation, useGenerateNewCodeQuery, useUpdateCouponMutation,
  useValidateQuery,
};

