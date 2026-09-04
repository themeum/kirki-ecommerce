<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

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
     * @return array<string, string>
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
     * Get the formatted payment status.
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
