<?php

namespace Kirki\Ecommerce\App\Events\Inventory;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for tracked variants whose available stock ran out.
 *
 * Dispatched only when a stock reduction crosses that level, not on every
 * reduction below it. The crossings of one order operation are grouped into
 * a single event.
 *
 * @since 1.0.0
 */
class VariantsOutOfStockEvent
{
    use Dispatchable;

    /**
     * IDs of the variants whose stock crossed the level.
     *
     * @var int[]
     */
    public $variant_ids;

    /**
     * Create the out-of-stock event for a group of variants.
     *
     * @since 1.0.0
     *
     * @param int[] $variant_ids IDs of the variants whose stock crossed the level.
     */
    public function __construct(array $variant_ids)
    {
        $this->variant_ids = $variant_ids;
    }
}
