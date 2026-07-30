import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { CouponListItemSchema, CouponSchema } from '@/schemas/catalog/coupon';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import {
  parseData,
  parseResponse,
  toastMutationError,
  toastMutationSuccess,
  unwrapResponse
} from '@/services/helpers';
import { BulkActionParams, CouponFormData, ListParams } from '@/types';
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

const createCoupon = (data: CouponFormData) => {
  return apiClient
    .post(endpoints.COUPONS, data)
    .then((response) => parseResponse(CouponSchema, response));
};

const updateCoupon = ({ id, data }: { id: number; data: CouponFormData }) => {
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
      void queryClient.invalidateQueries({ queryKey: ['Coupons'] });
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
      void queryClient.invalidateQueries({ queryKey: ['Coupons'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Coupon(variables.id),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
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

const validateCode = (code: string) => {
  return apiClient
    .get(endpoints.COUPON('validate'), { params: { code } })
    .then((response) => unwrapResponse<boolean>(response));
};

const useValidateQuery = (code: string, enabled = true) =>
  useQuery({
    queryKey: ['CouponValidate', code],
    queryFn: () => validateCode(code),
    enabled: enabled && Boolean(code),
    placeholderData: keepPreviousData,
  });

const generateNewCode = () => {
  return apiClient
    .get(endpoints.COUPON('generate-new-code'))
    .then((response) => unwrapResponse<string>(response));
};

const useGenerateNewCodeQuery = () =>
  useQuery({
    queryKey: ['CouponNewCode'],
    queryFn: () => generateNewCode(),
    enabled: false,
    staleTime: 0,
  });

export {
  useBulkDeleteCouponsMutation,
  useCouponQuery,
  useCouponsQuery,
  useCreateCouponMutation, useGenerateNewCodeQuery, useUpdateCouponMutation,
  useValidateQuery
};

