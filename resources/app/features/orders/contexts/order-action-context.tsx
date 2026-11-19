import { createContext, type ReactNode, useState } from 'react';

import type { MarkAsShippedPayload } from '@/features/orders/components/order-details/mark-as-shipped-dialog';
import { useOrderDetails } from '@/features/orders/hooks/use-order-details';
import {
  getAvailableActions,
  ORDER_ACTION_GROUP,
  ORDER_ACTIONS,
  type OrderAction,
  type OrderActionPayload,
  PAYMENT_ACTION_GROUP,
} from '@/features/orders/lib/order-actions';
import type { AddTrackingFormPayload } from '@/features/orders/schemas/forms/add-tracking-form';
import { useOrderActionMutation } from '@/features/orders/services/order';
import { isDefined } from '@/utils/object';

type OrderActionCallbacks = Pick<
  NonNullable<Parameters<ReturnType<typeof useOrderActionMutation>['mutate']>[1]>,
  'onSuccess' | 'onError'
>;

export type OrderActionContextValue = {
  orderActions: OrderAction[];
  paymentActions: OrderAction[];
  isActionPending: boolean;
  isTrackingDialogOpen: boolean;
  setIsTrackingDialogOpen: (open: boolean) => void;
  isMarkAsPaidDialogOpen: boolean;
  setIsMarkAsPaidDialogOpen: (open: boolean) => void;
  isMarkAsShippedDialogOpen: boolean;
  setIsMarkAsShippedDialogOpen: (open: boolean) => void;
  handleAction: (action: OrderAction) => void;
  handleAddTracking: (values: AddTrackingFormPayload) => void;
  handleRemoveTracking: () => void;
  handleMarkAsShipped: (payload: MarkAsShippedPayload) => void;
  handleMarkAsPaid: (paymentProvider: string) => void;
};

const OrderActionContext = createContext<OrderActionContextValue | null>(null);

type OrderActionProviderProps = {
  children: ReactNode;
};

const OrderActionProvider = ({ children }: OrderActionProviderProps) => {
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);
  const [isMarkAsShippedDialogOpen, setIsMarkAsShippedDialogOpen] = useState(false);

  const { order } = useOrderDetails();
  const actionMutation = useOrderActionMutation();

  const performAction = (payload: OrderActionPayload, callbacks?: OrderActionCallbacks) => {
    if (!isDefined(order)) {
      return;
    }
    actionMutation.mutate({ id: order.id, ...payload }, callbacks);
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

    if (action === ORDER_ACTIONS.MARK_AS_SHIPPED) {
      setIsMarkAsShippedDialogOpen(true);
      return;
    }

    performAction({ action });
  };

  const handleMarkAsShipped = ({ tracking, notify_customer }: MarkAsShippedPayload) => {
    performAction(
      { action: ORDER_ACTIONS.MARK_AS_SHIPPED, notify_customer, ...tracking },
      { onSuccess: () => setIsMarkAsShippedDialogOpen(false) },
    );
  };

  const handleAddTracking = (values: AddTrackingFormPayload) => {
    if (!isDefined(order)) {
      return;
    }
    actionMutation.mutate(
      { id: order.id, action: ORDER_ACTIONS.ADD_TRACKING, ...values },
      { onSuccess: () => setIsTrackingDialogOpen(false) },
    );
  };

  const handleRemoveTracking = () => {
    performAction(
      { action: ORDER_ACTIONS.REMOVE_TRACKING },
      { onSuccess: () => setIsTrackingDialogOpen(false) },
    );
  };

  const handleMarkAsPaid = (paymentProvider: string) => {
    if (!isDefined(order)) {
      return;
    }
    actionMutation.mutate(
      { id: order.id, action: ORDER_ACTIONS.MARK_AS_PAID, payment_provider: paymentProvider },
      { onSuccess: () => setIsMarkAsPaidDialogOpen(false) },
    );
  };

  const value: OrderActionContextValue = {
    orderActions: order ? getAvailableActions(order, ORDER_ACTION_GROUP) : [],
    paymentActions: order ? getAvailableActions(order, PAYMENT_ACTION_GROUP) : [],
    isActionPending: actionMutation.isPending,
    isTrackingDialogOpen,
    setIsTrackingDialogOpen,
    isMarkAsPaidDialogOpen,
    setIsMarkAsPaidDialogOpen,
    isMarkAsShippedDialogOpen,
    setIsMarkAsShippedDialogOpen,
    handleAction,
    handleAddTracking,
    handleRemoveTracking,
    handleMarkAsShipped,
    handleMarkAsPaid,
  };

  return <OrderActionContext.Provider value={value}>{children}</OrderActionContext.Provider>;
};

OrderActionProvider.displayName = 'OrderActionProvider';

export { OrderActionContext, OrderActionProvider };
