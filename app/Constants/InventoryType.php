<?php

namespace Kirki\Ecommerce\App\Constants;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Stock states used to filter variants by inventory.
 *
 * @since 1.0.0
 */
class InventoryType
{
    use HasConstants;
    const IN_STOCK = 'in_stock';
    const OUT_OF_STOCK = 'out_of_stock';
}
