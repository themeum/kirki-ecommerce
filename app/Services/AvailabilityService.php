<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;

class AvailabilityService
{
    /**
     * Resolve a single variant's stock state (Layer 1).
     *
     * @param bool $track_inventory
     * @param bool $in_stock
     * @param int $available_quantity
     * @param int|null $low_stock_threshold The variant's own threshold, or null to fall back to the store default.
     * @param int $store_default_threshold
     *
     * @return string One of AvailabilityStatus::IN_STOCK|LOW_STOCK|OUT_OF_STOCK
     */
    public function resolve_variant_status($track_inventory, $in_stock, $available_quantity, $low_stock_threshold, $store_default_threshold)
    {
        if (!$track_inventory) {
            return $in_stock ? AvailabilityStatus::IN_STOCK : AvailabilityStatus::OUT_OF_STOCK;
        }

        if ($available_quantity <= 0) {
            return AvailabilityStatus::OUT_OF_STOCK;
        }

        $threshold = is_null($low_stock_threshold) ? $store_default_threshold : $low_stock_threshold;

        if ($available_quantity <= $threshold) {
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
            $statuses[] = $this->resolve_variant_status(
                $variant->track_inventory,
                $variant->in_stock,
                $variant->available_quantity,
                $variant->low_stock_threshold,
                $store_default_threshold
            );
        }

        return $this->resolve_group_status($statuses);
    }
}
