<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Constants;

defined('ABSPATH') || exit;

/**
 * Stored order statuses of WooCommerce.
 *
 * @since 1.0.0
 */
final class WooCommerceOrderStatus
{
    public const PENDING = 'wc-pending';
    public const PROCESSING = 'wc-processing';
    public const ON_HOLD = 'wc-on-hold';
    public const COMPLETED = 'wc-completed';
    public const CANCELLED = 'wc-cancelled';
    public const REFUNDED = 'wc-refunded';
    public const FAILED = 'wc-failed';
}
