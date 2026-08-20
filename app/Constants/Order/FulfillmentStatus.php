<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

final class FulfillmentStatus
{
    use HasConstants;

    const UNFULFILLED = 'unfulfilled';
    const PROCESSING = 'processing';
    const SHIPPED = 'shipped';
    const DELIVERED = 'delivered';
    const ON_HOLD = 'on-hold';
    const CANCELLED = 'cancelled';
    const RETURNED = 'returned';

    /**
     * Get all fulfillment statuses.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    public static function get_list()
    {
        return [
            self::UNFULFILLED => __('Unfulfilled', 'kirki-ecommerce'),
            self::PROCESSING => __('Processing', 'kirki-ecommerce'),
            self::SHIPPED => __('Shipped', 'kirki-ecommerce'),
            self::DELIVERED => __('Delivered', 'kirki-ecommerce'),
            self::ON_HOLD => __('On Hold', 'kirki-ecommerce'),
            self::CANCELLED => __('Cancelled', 'kirki-ecommerce'),
            self::RETURNED => __('Returned', 'kirki-ecommerce'),
        ];
    }

    /**
     * Get the formatted status.
     *
     * @since 1.0.0
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
