<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Models\Variant;

class AvailabilityService
{
    /**
     * Resolve a single variant's stock state (Layer 1).
     *
     * @param Variant $variant
     * @param int $store_default_threshold
     *
     * @return string One of AvailabilityStatus::IN_STOCK|LOW_STOCK|OUT_OF_STOCK
     */
    public function resolve_variant_status(Variant $variant, int $store_default_threshold = 0)
    {
        if (!$variant->track_inventory) {
            return $variant->in_stock ? AvailabilityStatus::IN_STOCK : AvailabilityStatus::OUT_OF_STOCK;
        }

        if ($variant->available_quantity <= 0) {
            return AvailabilityStatus::OUT_OF_STOCK;
        }

        $threshold = is_null($variant->low_stock_threshold) ? $store_default_threshold : $variant->low_stock_threshold;

        if ($variant->available_quantity <= $threshold) {
            return AvailabilityStatus::LOW_STOCK;
        }

        return AvailabilityStatus::IN_STOCK;
    }

    /**
     * Resolve a set of variant statuses to a group-level status (Layer 2).
     *
     * Order-independent: every OS -> OS, else any LS -> LS, else any OS -> PS, else IS.
     *
     * @param string[] $statuses
     *
     * @return string|null One of AvailabilityStatus::* values, or null for an empty set
     */
    public function resolve_group_status(array $statuses)
    {
        if (empty($statuses)) {
            return null;
        }

        $all_out_of_stock = empty(array_diff($statuses, [AvailabilityStatus::OUT_OF_STOCK]));

        if ($all_out_of_stock) {
            return AvailabilityStatus::OUT_OF_STOCK;
        }

        if (in_array(AvailabilityStatus::LOW_STOCK, $statuses, true)) {
            return AvailabilityStatus::LOW_STOCK;
        }

        if (in_array(AvailabilityStatus::OUT_OF_STOCK, $statuses, true)) {
            return AvailabilityStatus::PARTIALLY_STOCKED;
        }

        return AvailabilityStatus::IN_STOCK;
    }

    /**
     * Resolve the group-level status for a collection of variants (Layers 1 and 2 combined).
     *
     * @param iterable $variants Each element must expose track_inventory, in_stock,
     *                           available_quantity and low_stock_threshold.
     * @param int $store_default_threshold
     *
     * @return string|null One of AvailabilityStatus::* values, or null when $variants is empty
     */
    public function resolve_product_status($variants, $store_default_threshold)
    {
        $statuses = [];

        foreach ($variants as $variant) {
            $statuses[] = $this->resolve_variant_status($variant, $store_default_threshold);
        }

        return $this->resolve_group_status($statuses);
    }

    /**
     * Format a status label, prefixing the quantity for "In Stock" when there
     * is a tracked amount to show. A zero quantity (nothing tracked) falls
     * back to the plain label rather than reading "0 In Stock". When
     * $variant_count is given, the label is suffixed with the variant count
     * so a glance at the list reveals which products have variants.
     *
     * @param string $status
     * @param int $quantity Summed available_quantity of tracked, in-stock variants.
     * @param int|null $variant_count Number of variants, or null for a product without variants.
     *
     * @return string
     */
    public function format_status_label($status, $quantity = 0, $variant_count = null)
    {
        $label = ($status === AvailabilityStatus::IN_STOCK && $quantity > 0)
            ? sprintf(__('%d In Stock', 'kirki-ecommerce'), $quantity)
            : AvailabilityStatus::get_formatted($status);

        if (is_null($variant_count)) {
            return $label;
        }

        /* translators: 1: availability label, 2: variant count */
        return sprintf(__('%1$s <span>across %2$d variants</span>', 'kirki-ecommerce'), $label, $variant_count);
    }
}
