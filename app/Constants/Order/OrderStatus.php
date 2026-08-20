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

    /**
     * Get all order statuses.
     *
     * @return array<string, string>
     */
    public static function get_list()
    {
        return [
            self::PENDING               => __('Pending', 'kirki-ecommerce'),
            self::ON_HOLD_UNPAID        => __('On Hold', 'kirki-ecommerce'),
            self::UNPAID_PROCESSING     => __('Processing', 'kirki-ecommerce'),
            self::PAID_UNFULFILLED      => __('Paid (Unfulfilled)', 'kirki-ecommerce'),
            self::PAID_PROCESSING       => __('Paid (Processing)', 'kirki-ecommerce'),
            self::PAID_SHIPPED          => __('Paid (Shipped)', 'kirki-ecommerce'),
            self::SHIPPED_UNPAID        => __('Shipped (Unpaid)', 'kirki-ecommerce'),
            self::DELIVERED_UNPAID      => __('Delivered (Unpaid)', 'kirki-ecommerce'),
            self::COMPLETED             => __('Completed', 'kirki-ecommerce'),
            self::ON_HOLD_PAID          => __('On Hold (Paid)', 'kirki-ecommerce'),
            self::PAID_CANCELLED        => __('Cancelled (Paid)', 'kirki-ecommerce'),
            self::UNPAID_CANCELLED      => __('Cancelled (Unpaid)', 'kirki-ecommerce'),
            self::FAILED_CANCELLED      => __('Cancelled (Failed)', 'kirki-ecommerce'),
            self::FAILED_UNFULFILLED    => __('Failed (Unfulfilled)', 'kirki-ecommerce'),
            self::FAILED_PROCESSING     => __('Failed (Processing)', 'kirki-ecommerce'),
            self::FAILED_SHIPPED        => __('Failed (Shipped)', 'kirki-ecommerce'),
            self::FAILED_DELIVERED      => __('Failed (Delivered)', 'kirki-ecommerce'),
            self::FAILED_ON_HOLD        => __('On Hold (Failed)', 'kirki-ecommerce'),
            self::REFUND_REQUESTED      => __('Refund Requested', 'kirki-ecommerce'),
            self::REFUND_IN_PROGRESS    => __('Refund in Progress', 'kirki-ecommerce'),
            self::REFUNDED              => __('Refunded', 'kirki-ecommerce'),
            self::REFUND_DECLINED       => __('Refund Declined', 'kirki-ecommerce'),
            self::RETURNED_PENDING_REFUND => __('Returned (Pending Refund)', 'kirki-ecommerce'),
            self::REFUNDED_PARTIALLY    => __('Refunded (Partially)', 'kirki-ecommerce'),
        ];
    }

    /**
     * Get the formatted status.
     *
     * @param string $status
     *
     * @return string
     */
    public static function get_formatted(string $status)
    {
        return static::get_list()[$status] ?? '';
    }
}
