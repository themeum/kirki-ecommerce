import { zodResolver } from '@hookform/resolvers/zod';
import { createContext, type ReactNode, useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { getFulfillmentBadgeInfo, getPaymentBadgeInfo } from '@/features/orders/lib/order-badge';
import type { Order } from '@/features/orders/schemas/catalog/order';
import type {
  OrderPartialField,
  OrderPartialFormInput,
  OrderPartialPayload,
} from '@/features/orders/schemas/forms/order-form';
import { OrderPartialFormSchema } from '@/features/orders/schemas/forms/order-form';
import { useOrderQuery, usePartialUpdateOrderMutation } from '@/features/orders/services/order';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { isDefined } from '@/utils/object';

export type OrderDetailsContextValue = {
  order?: Order;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
  form: UseFormReturn<OrderPartialFormInput, unknown, OrderPartialPayload>;
  paymentBadge: ReturnType<typeof getPaymentBadgeInfo> | undefined;
  fulfillmentBadge: ReturnType<typeof getFulfillmentBadgeInfo> | undefined;
  isSaving: boolean;
  handleSaveOrder: (field: OrderPartialField) => Promise<boolean>;
};

const OrderDetailsContext = createContext<OrderDetailsContextValue | null>(null);

type OrderDetailsProviderProps = {
  children: ReactNode;
  orderId?: string;
};

const OrderDetailsProvider = ({ children, orderId }: OrderDetailsProviderProps) => {
  const {
    data: order,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useOrderQuery(orderId!, Boolean(orderId));
  const updateMutation = usePartialUpdateOrderMutation();

  const form = useForm<OrderPartialFormInput, unknown, OrderPartialPayload>({
    resolver: zodResolver(OrderPartialFormSchema),
    defaultValues: getDefaults(OrderPartialFormSchema),
  });

  useEffect(() => {
    if (!isDefined(order)) {
      return;
    }

    form.reset(pickFormValues(OrderPartialFormSchema, order));
  }, [order, form]);

  const handleSaveOrder = async (field: OrderPartialField) => {
    let isSaved = false;

    await form.handleSubmit(async (payload) => {
      if (!isDefined(order)) {
        return;
      }
      try {
        await updateMutation.mutateAsync({
          id: order.id,
          data: { [field]: payload[field] },
        });
        isSaved = true;
      } catch (error) {
        applyServerErrors(form, error as ErrorResponse);
      }
    })();

    return isSaved;
  };

  const value: OrderDetailsContextValue = {
    order,
    isLoading,
    isError,
    isFetching,
    refetch: () => void refetch(),
    form,
    paymentBadge: order ? getPaymentBadgeInfo(order.payment_status) : undefined,
    fulfillmentBadge: order ? getFulfillmentBadgeInfo(order.fulfillment_status) : undefined,
    isSaving: updateMutation.isPending,
    handleSaveOrder,
  };

  return <OrderDetailsContext.Provider value={value}>{children}</OrderDetailsContext.Provider>;
};

OrderDetailsProvider.displayName = 'OrderDetailsProvider';

export { OrderDetailsContext, OrderDetailsProvider };
