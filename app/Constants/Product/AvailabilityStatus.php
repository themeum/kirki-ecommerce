<?php

namespace Kirki\Ecommerce\App\Constants\Product;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

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
     * @return array<string, string>
     */
    public static function get_list()
    {
        return [
            self::IN_STOCK => __('In Stock', 'kirki-ecommerce'),
            self::LOW_STOCK => __('Low Stock', 'kirki-ecommerce'),
            self::OUT_OF_STOCK => __('Out of Stock', 'kirki-ecommerce'),
            self::PARTIALLY_STOCKED => __('Partially Stocked', 'kirki-ecommerce'),
        ];
    }

    /**
     * Get the translated label for an availability status.
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
