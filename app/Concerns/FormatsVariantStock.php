<?php

namespace Kirki\Ecommerce\App\Concerns;

defined('ABSPATH') || exit;

/**
 * Formats a variant's current stock and per-order limit values, shared by the order and order calculation resources.
 *
 * @since 1.0.0
 */
trait FormatsVariantStock
{
    /**
     * Get a variant's current stock and per-order limit values.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\Variant|null $variant Variant; null when it was deleted.
     * @return array<string, bool|int|null> Every value is null when there is no variant.
     */
    protected function format_variant_stock_fields($variant)
    {
        return [
            'allow_back_order' => $variant ? $variant->allow_back_order : null,
            'track_inventory' => $variant ? $variant->track_inventory : null,
            'available_quantity' => $variant ? $variant->available_quantity : null,
            'in_stock' => $variant ? $variant->in_stock : null,
            'has_limit_per_order' => $variant ? $variant->has_limit_per_order : null,
            'max_per_order' => $variant ? $variant->max_per_order : null,
        ];
    }
}
