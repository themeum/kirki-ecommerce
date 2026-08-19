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

    public static function format_fulfillment_status(string $status)
    {
        switch ($status) {
            case self::UNFULFILLED:
                return __('Unfulfilled', 'kirki-ecommerce');
            case self::PROCESSING:
                return __('Processing', 'kirki-ecommerce');
            case self::SHIPPED:
                return __('Shipped', 'kirki-ecommerce');
            case self::DELIVERED:
                return __('Delivered', 'kirki-ecommerce');
            case self::ON_HOLD:
                return __('On Hold', 'kirki-ecommerce');
            case self::CANCELLED:
                return __('Cancelled', 'kirki-ecommerce');
            case self::RETURNED:
                return __('Returned', 'kirki-ecommerce');
            default:
                return __('Unknown', 'kirki-ecommerce');
        }
    }
}
