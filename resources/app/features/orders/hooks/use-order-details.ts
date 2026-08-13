import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import {
  getAvailableActions,
  ORDER_ACTION_GROUP,
  ORDER_ACTIONS,
  type OrderAction,
  type OrderActionPayload,
  PAYMENT_ACTION_GROUP,
} from '@/features/orders/lib/order-actions';
import { toOrderFormAddresses } from '@/features/orders/lib/order-address';
import {
  getFulfillmentBadgeInfo,
  getPaymentBadgeInfo,
} from '@/features/orders/lib/order-badge';
import type { OrderFormInput, OrderFormPayload } from '@/features/orders/schemas/forms/order-form';
import { OrderFormSchema } from '@/features/orders/schemas/forms/order-form';
import { useOrderActionMutation, useOrderQuery, useUpdateOrderMutation } from '@/features/orders/services/order';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';

type UseOrderDetailsResult = {
  order: ReturnType<typeof useOrderQuery>['data'];
  isLoading: boolean;
  isError: boolean;
  form: UseFormReturn<OrderFormInput, unknown, OrderFormPayload>;
  paymentBadge: ReturnType<typeof getPaymentBadgeInfo> | undefined;
  fulfillmentBadge: ReturnType<typeof getFulfillmentBadgeInfo> | undefined;
  orderActions: OrderAction[];
  paymentActions: OrderAction[];
  isActionPending: boolean;
  isSaving: boolean;
  isTrackingDialogOpen: boolean;
  setIsTrackingDialogOpen: (open: boolean) => void;
  isMarkAsPaidDialogOpen: boolean;
  setIsMarkAsPaidDialogOpen: (open: boolean) => void;
  handleAction: (action: OrderAction) => void;
  handleAddTracking: (values: {
    carrier: string;
    tracking_number: string;
    tracking_url: string;
  }) => void;
  handleMarkAsPaid: (paymentProvider: string) => void;
  handleSaveOrder: () => void;
};

export const useOrderDetails = (id: string | undefined): UseOrderDetailsResult => {
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);

  const { data: order, isLoading, isError } = useOrderQuery(id!, Boolean(id));
  const actionMutation = useOrderActionMutation();
  const updateMutation = useUpdateOrderMutation();

  const form = useForm<OrderFormInput, unknown, OrderFormPayload>({
    resolver: zodResolver(OrderFormSchema),
    defaultValues: { ...getDefaults(OrderFormSchema), items: [] },
  });

  useEffect(() => {
    if (!order) {
      return;
    }

    form.reset(
      pickFormValues(OrderFormSchema, order, {
        items: order.items.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        ...toOrderFormAddresses(order),
      }),
    );
  }, [order, form]);

  const performAction = (payload: OrderActionPayload) => {
    if (!order) {
      return;
    }
    actionMutation.mutate({ id: order.id, ...payload });
  };

  const handleAction = (action: OrderAction) => {
    if (action === ORDER_ACTIONS.ADD_TRACKING) {
      setIsTrackingDialogOpen(true);
      return;
    }

    if (action === ORDER_ACTIONS.MARK_AS_PAID) {
      setIsMarkAsPaidDialogOpen(true);
      return;
    }

    performAction({ action });
  };

  const handleAddTracking = (values: {
    carrier: string;
    tracking_number: string;
    tracking_url: string;
  }) => {
    if (!order) {
      return;
    }
    actionMutation.mutate(
      { id: order.id, action: ORDER_ACTIONS.ADD_TRACKING, ...values },
      { onSuccess: () => setIsTrackingDialogOpen(false) },
    );
  };

  const handleMarkAsPaid = (paymentProvider: string) => {
    if (!order) {
      return;
    }
    actionMutation.mutate(
      { id: order.id, action: ORDER_ACTIONS.MARK_AS_PAID, payment_provider: paymentProvider },
      { onSuccess: () => setIsMarkAsPaidDialogOpen(false) },
    );
  };

  const handleSaveOrder = form.handleSubmit(async (payload) => {
    if (!order) {
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: order.id, data: payload });
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  });

  return {
    order,
    isLoading,
    isError,
    form,
    paymentBadge: order ? getPaymentBadgeInfo(order.payment_status) : undefined,
    fulfillmentBadge: order ? getFulfillmentBadgeInfo(order.fulfillment_status) : undefined,
    orderActions: order ? getAvailableActions(order, ORDER_ACTION_GROUP) : [],
    paymentActions: order ? getAvailableActions(order, PAYMENT_ACTION_GROUP) : [],
    isActionPending: actionMutation.isPending,
    isSaving: updateMutation.isPending,
    isTrackingDialogOpen,
    setIsTrackingDialogOpen,
    isMarkAsPaidDialogOpen,
    setIsMarkAsPaidDialogOpen,
    handleAction,
    handleAddTracking,
    handleMarkAsPaid,
    handleSaveOrder,
  };
};
