<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Payment statuses of an order.
 *
 * @since 1.0.0
 */
final class PaymentStatus
{
    use HasConstants;

    const PAID = 'paid';
    const UNPAID = 'unpaid';
    const FAILED = 'failed';
    const PROCESSING = 'processing';
    const PENDING = 'pending';
    const CANCELLED = 'cancelled';

    // @todo: need to implement refund logics later, now just defined
    const REFUNDING = 'refunding';
    const REFUNDED = 'refunded';

    /**
     * Get all payment statuses.
     *
     * @since 1.0.0
     *
     * @return array<string, string> Translated labels keyed by status.
     */
    public static function get_list()
    {
        return [
            self::PAID               => __('Paid', 'kirki-ecommerce'),
            self::UNPAID             => __('Unpaid', 'kirki-ecommerce'),
            self::FAILED             => __('Failed', 'kirki-ecommerce'),
            self::PROCESSING         => __('Processing', 'kirki-ecommerce'),
            self::PENDING            => __('Pending', 'kirki-ecommerce'),
            self::CANCELLED          => __('Cancelled', 'kirki-ecommerce'),
            self::REFUNDING          => __('Refunding', 'kirki-ecommerce'),
            self::REFUNDED           => __('Refunded', 'kirki-ecommerce'),
        ];
    }

    /**
     * Get the translated label for a payment status.
     *
     * @since 1.0.0
     *
     * @param string $status Payment status key.
     * @return string Label, or an empty string for an unknown status.
     */
    public static function get_formatted(string $status)
    {
        return static::get_list()[$status] ?? '';
    }
}
