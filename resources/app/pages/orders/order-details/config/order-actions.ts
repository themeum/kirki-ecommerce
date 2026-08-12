import type { FulfillmentStatus, OrderItem, OrderStatus, PaymentStatus } from '@/schemas/catalog/order';
import { __ } from '@/wpi18n';
import orderStateMatrix from '@data/order-state-matrix.json';

/**
 * Mirrors app/Constants/Order/OrderAction.php. JSON imports widen string literals, so the
 * shared matrix cannot supply this union — it stays declared here and types the matrix below.
 */
const ORDER_ACTIONS = {
  MARK_AS_PROCESSING: 'mark-as-processing',
  MARK_AS_SHIPPED: 'mark-as-shipped',
  MARK_AS_DELIVERED: 'mark-as-delivered',
  MARK_AS_HOLD: 'mark-as-hold',
  CANCEL_FULFILLMENT: 'cancel-fulfillment',
  RESUME_FULFILLMENT: 'resume-fulfillment',
  ADD_TRACKING: 'add-tracking',
  MARK_AS_PAID: 'mark-as-paid',
  SEND_PAYMENT_LINK: 'send-payment-link',
  SEND_INVOICE: 'send-invoice',
  CANCEL_ORDER: 'cancel-order',
  ARCHIVE_ORDER: 'archive-order',
  RESEND_ORDER_EMAIL: 'resend-order-email',
} as const;

type OrderAction = (typeof ORDER_ACTIONS)[keyof typeof ORDER_ACTIONS];

type OrderActionPayload = {
  action: OrderAction;
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  reason?: string;
  payment_provider?: string;
};

type OrderStatusState = {
  fulfillment_status: FulfillmentStatus;
  payment_status: PaymentStatus;
  fulfillment_actions: OrderAction[];
  payment_actions: OrderAction[];
  order_actions: OrderAction[];
  transitions: Partial<Record<OrderAction, OrderStatus>>;
};

/**
 * The shared order state matrix from resources/data/order-state-matrix.json, also read by
 * OrderStatus::get_transition_matrix() on the backend. Refund-cluster statuses
 * (refund_requested, refund_in_progress, refunded, refund_declined,
 * returned_pending_refund, refunded_partially) are intentionally absent — refund actions
 * are not implemented yet, so orders in those statuses have no available actions here.
 */
const ORDER_STATE_MATRIX = orderStateMatrix as Partial<Record<OrderStatus, OrderStatusState>>;

const ORDER_ACTION_GROUP: OrderAction[] = [
  ORDER_ACTIONS.CANCEL_ORDER,
  ORDER_ACTIONS.ARCHIVE_ORDER,
  ORDER_ACTIONS.RESEND_ORDER_EMAIL,
];

const PAYMENT_ACTION_GROUP: OrderAction[] = [
  ORDER_ACTIONS.MARK_AS_PAID,
  ORDER_ACTIONS.SEND_PAYMENT_LINK,
  ORDER_ACTIONS.SEND_INVOICE,
];

const FULFILLMENT_ACTION_GROUP: OrderAction[] = [
  ORDER_ACTIONS.MARK_AS_PROCESSING,
  ORDER_ACTIONS.MARK_AS_SHIPPED,
  ORDER_ACTIONS.MARK_AS_DELIVERED,
  ORDER_ACTIONS.MARK_AS_HOLD,
  ORDER_ACTIONS.CANCEL_FULFILLMENT,
  ORDER_ACTIONS.RESUME_FULFILLMENT,
  ORDER_ACTIONS.ADD_TRACKING,
];

const getActionLabel = (action: OrderAction): string => {
  const labels: Record<OrderAction, string> = {
    [ORDER_ACTIONS.MARK_AS_PROCESSING]: __('Mark as processing', 'kirki-ecommerce'),
    [ORDER_ACTIONS.MARK_AS_SHIPPED]: __('Mark as shipped', 'kirki-ecommerce'),
    [ORDER_ACTIONS.MARK_AS_DELIVERED]: __('Mark as delivered', 'kirki-ecommerce'),
    [ORDER_ACTIONS.MARK_AS_HOLD]: __('On hold', 'kirki-ecommerce'),
    [ORDER_ACTIONS.CANCEL_FULFILLMENT]: __('Cancel fulfillment', 'kirki-ecommerce'),
    [ORDER_ACTIONS.RESUME_FULFILLMENT]: __('Resume fulfillment', 'kirki-ecommerce'),
    [ORDER_ACTIONS.ADD_TRACKING]: __('Add tracking', 'kirki-ecommerce'),
    [ORDER_ACTIONS.MARK_AS_PAID]: __('Mark as paid', 'kirki-ecommerce'),
    [ORDER_ACTIONS.SEND_PAYMENT_LINK]: __('Send payment link', 'kirki-ecommerce'),
    [ORDER_ACTIONS.SEND_INVOICE]: __('Send invoice', 'kirki-ecommerce'),
    [ORDER_ACTIONS.CANCEL_ORDER]: __('Cancel order', 'kirki-ecommerce'),
    [ORDER_ACTIONS.ARCHIVE_ORDER]: __('Archive order', 'kirki-ecommerce'),
    [ORDER_ACTIONS.RESEND_ORDER_EMAIL]: __('Resend order email', 'kirki-ecommerce'),
  };

  return labels[action];
};

const isActionAvailable = (order: OrderItem, action: OrderAction): boolean => {
  const state = ORDER_STATE_MATRIX[order.status];

  if (!state) {
    return false;
  }

  return (
    state.fulfillment_actions.includes(action) ||
    state.payment_actions.includes(action) ||
    state.order_actions.includes(action)
  );
};

const getAvailableActions = (order: OrderItem, group: OrderAction[]): OrderAction[] =>
  group.filter((action) => isActionAvailable(order, action));

export {
  FULFILLMENT_ACTION_GROUP,
  getActionLabel,
  getAvailableActions,
  isActionAvailable,
  ORDER_ACTION_GROUP,
  ORDER_ACTIONS,
  type OrderAction,
  type OrderActionPayload,
  PAYMENT_ACTION_GROUP};

