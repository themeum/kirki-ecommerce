<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Exception;
use Kirki\Ecommerce\Framework\Concerns\HasConstants;

use function Kirki\Ecommerce\Framework\json_decoded_data;
use function Kirki\Ecommerce\Framework\resource_path;

final class OrderStatus
{
    use HasConstants;

    const PENDING = 'pending';
    const UNPAID_PROCESSING = 'unpaid_processing';
    const PAID_UNFULFILLED = 'paid_unfulfilled';
    const PAID_PROCESSING = 'paid_processing';
    const PAID_SHIPPED = 'paid_shipped';
    const SHIPPED_UNPAID = 'shipped_unpaid';
    const DELIVERED_UNPAID = 'delivered_unpaid';
    const COMPLETED = 'completed';
    const ON_HOLD_PAID = 'on_hold_paid';
    const ON_HOLD_UNPAID = 'on_hold_unpaid';
    const PAID_CANCELLED = 'paid_cancelled';
    const UNPAID_CANCELLED = 'unpaid_cancelled';
    const FAILED_CANCELLED = 'failed_cancelled';
    const FAILED_UNFULFILLED = 'failed_unfulfilled';
    const FAILED_PROCESSING = 'failed_processing';
    const FAILED_SHIPPED = 'failed_shipped';
    const FAILED_DELIVERED = 'failed_delivered';
    const FAILED_ON_HOLD = 'failed_on_hold';
    const REFUND_REQUESTED = 'refund_requested';
    const REFUND_IN_PROGRESS = 'refund_in_progress';
    const REFUNDED = 'refunded';
    const REFUND_DECLINED = 'refund_declined';
    const RETURNED_PENDING_REFUND = 'returned_pending_refund';
    const REFUNDED_PARTIALLY = 'refunded_partially';

    /**
     * The order lifecycle state machine, shared with the frontend.
     *
     * @todo Refund-cluster statuses (REFUND_REQUESTED, REFUND_IN_PROGRESS, REFUNDED,
     * REFUND_DECLINED, RETURNED_PENDING_REFUND, REFUNDED_PARTIALLY) are not part of this
     * matrix yet; refund actions remain unimplemented pending a dedicated refund state
     * machine (see PerformOrderAction::guard()).
     *
     * @return array<string, array{fulfillment_status: string, payment_status: string, fulfillment_actions: string[], payment_actions: string[], order_actions: string[], transitions: array<string, string>}>
     */
    public static function get_transition_matrix()
    {
        return json_decoded_data(resource_path('data/order-state-matrix.json')) ?? [];
    }

    /**
     * Get the state definition for an order status.
     *
     * @param string $order_status
     *
     * @return array
     * @throws Exception When the order status has no matrix entry.
     */
    public static function get_state(string $order_status)
    {
        $matrix = static::get_transition_matrix();

        if (!isset($matrix[$order_status])) {
            throw new Exception(__('Unknown order status.', 'kirki-ecommerce'));
        }

        return $matrix[$order_status];
    }

    /**
     * Find the order status matching a fulfillment/payment status pair.
     *
     * @param string $fulfillment_status
     * @param string $payment_status
     *
     * @return string
     * @throws Exception When no order status matches the given pair.
     */
    public static function find_by_pair(string $fulfillment_status, string $payment_status)
    {
        foreach (static::get_transition_matrix() as $order_status => $state) {
            if ($state['fulfillment_status'] === $fulfillment_status && $state['payment_status'] === $payment_status) {
                return $order_status;
            }
        }

        throw new Exception(__('Cannot resolve order status.', 'kirki-ecommerce'));
    }

    public static function format_order_status(string $order_status)
    {
        switch ($order_status) {
            case self::PENDING:
            case self::PAID_UNFULFILLED:
                return __('Pending', 'kirki-ecommerce');
            case self::ON_HOLD_UNPAID:
            case self::ON_HOLD_PAID:
                return __('On Hold', 'kirki-ecommerce');
            case self::UNPAID_PROCESSING:
            case self::PAID_PROCESSING:
                return __('Processing', 'kirki-ecommerce');
            case self::PAID_SHIPPED:
            case self::SHIPPED_UNPAID:
                return __('Shipped', 'kirki-ecommerce');
            case self::DELIVERED_UNPAID:
            case self::COMPLETED:
                return __('Delivered', 'kirki-ecommerce');
            case self::PAID_CANCELLED:
            case self::UNPAID_CANCELLED:
            case self::FAILED_CANCELLED:
                return __('Cancelled', 'kirki-ecommerce');
            case self::REFUNDED:
            case self::REFUND_DECLINED:
            case self::RETURNED_PENDING_REFUND:
            case self::REFUNDED_PARTIALLY:
            case self::REFUND_REQUESTED:
            case self::REFUND_IN_PROGRESS:
                return __('Refunded', 'kirki-ecommerce');
            case self::FAILED_UNFULFILLED:
            case self::FAILED_PROCESSING:
            case self::FAILED_SHIPPED:
            case self::FAILED_DELIVERED:
            case self::FAILED_ON_HOLD:
                return __('Failed', 'kirki-ecommerce');
            default:
                return __('Unknown', 'kirki-ecommerce');
        }
    }
}
