<?php

namespace Kirki\Ecommerce\App\Constants\Product;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Stock availability statuses of a product.
 *
 * @since 1.0.0
 */
final class AvailabilityStatus
{
    use HasConstants;

    const IN_STOCK = 'in_stock';
    const LOW_STOCK = 'low_stock';
    const OUT_OF_STOCK = 'out_of_stock';
    const PARTIALLY_STOCKED = 'partially_stocked';

    /**
     * Get all availability statuses with their translated labels.
     *
     * @since 1.0.0
     *
     * @return array<string, string> Translated labels keyed by status.
     */
    public static function get_list()
    {
        return [
            static::IN_STOCK => __('In Stock', 'kirki-ecommerce'),
            static::LOW_STOCK => __('Low Stock', 'kirki-ecommerce'),
            static::OUT_OF_STOCK => __('Out of Stock', 'kirki-ecommerce'),
            static::PARTIALLY_STOCKED => __('Partially Stocked', 'kirki-ecommerce'),
        ];
    }

    /**
     * Get the translated label for an availability status.
     *
     * @since 1.0.0
     *
     * @param string $status Availability status key.
     * @return string Label, or an empty string for an unknown status.
     */
    public static function get_formatted(string $status)
    {
        return static::get_list()[$status] ?? '';
    }
}
