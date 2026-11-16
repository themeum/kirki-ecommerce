<?php

namespace Kirki\Ecommerce\App\Constants\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * The work that waits for a merchant, as the Home "Needs your attention" checks and the order list filter name it.
 *
 * Order::scope_apply_attention_filter() holds the condition of each one.
 *
 * @since 1.0.2
 */
final class OrderAttention
{
    use HasConstants;

    const TO_SHIP = 'to_ship';
    const TO_COLLECT = 'to_collect';
}
