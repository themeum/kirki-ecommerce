<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Inventory\VariantsLowStockEvent;
use Kirki\Ecommerce\App\Events\Inventory\VariantsOutOfStockEvent;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Checks and adjusts variant stock: availability, limits and reservations.
 *
 * @since 1.0.0
 */
class InventoryService
{
    /** @var VariantService */
    protected $variant_service;

    /** @var AvailabilityService */
    protected $availability_service;

    /**
     * Stock-level crossings buffered by collect_stock_alerts(), keyed by level then variant ID; null outside a collect scope.
     *
     * @var array{low: array<int, int>, out: array<int, int>}|null
     */
    protected $pending_stock_alerts = null;

    /**
     * Set up the service with the variant and availability services.
     *
     * @since 1.0.0
     *
     * @param VariantService      $variant_service      Variant lookup and quantity updates.
     * @param AvailabilityService $availability_service Low-stock threshold resolution.
     */
    public function __construct(VariantService $variant_service, AvailabilityService $availability_service)
    {
        $this->variant_service = $variant_service;
        $this->availability_service = $availability_service;
    }

    /**
     * Check whether enough stock exists for a quantity of a variant.
     *
     * Always true for untracked in-stock variants and variants that allow back orders.
     *
     * @since 1.0.0
     *
     * @param int $variant_id Variant ID.
     * @param int $quantity   Quantity wanted.
     * @return bool False when the variant does not exist.
     */
    public function has_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        if (empty($variant)) {
            return false;
        }

        if (!$variant->track_inventory && $variant->in_stock) {
            return true;
        }

        if ($variant->allow_back_order) {
            return true;
        }

        return $variant->available_quantity >= $quantity;
    }

    /**
     * Check whether a quantity is within the variant's per-order limit.
     *
     * @since 1.0.0
     *
     * @param int $variant_id Variant ID.
     * @param int $quantity   Quantity wanted.
     * @return bool False when the variant does not exist.
     */
    public function is_within_limit(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        if (empty($variant)) {
            return false;
        }

        if (!$variant->has_limit_per_order) {
            return true;
        }

        return $variant->max_per_order >= $quantity;
    }

    /**
     * Increase the available quantity of a variant.
     *
     * @since 1.0.0
     *
     * @param int $variant_id Variant ID.
     * @param int $quantity   Amount to add.
     * @return bool True when a row was updated.
     * @throws NotFoundException When the variant does not exist.
     */
    public function increment_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        /* translators: %s: variant ID */
        throw_if(empty($variant), sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $variant_id), NotFoundException::class, Response::NOT_FOUND);

        return $this->variant_service->increment($variant_id, 'available_quantity', $quantity);
    }

    /**
     * Decrease the available quantity of a variant.
     *
     * @since 1.0.0
     *
     * @param int $variant_id Variant ID.
     * @param int $quantity   Amount to subtract.
     * @return bool True when a row was updated.
     * @throws NotFoundException When the variant does not exist.
     * @throws ValidationException When a tracked variant without back orders lacks the stock.
     */
    public function decrement_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        /* translators: %s: variant ID */
        throw_if(empty($variant), sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $variant_id), NotFoundException::class, Response::NOT_FOUND);

        throw_if($variant->track_inventory && !$variant->allow_back_order && $variant->available_quantity < $quantity, __('Insufficient stock.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        $is_decremented = $this->variant_service->decrement($variant_id, 'available_quantity', $quantity);

        if ($is_decremented) {
            $this->record_stock_level_crossing($variant, $quantity);
        }

        return $is_decremented;
    }

    /**
     * Reserve stock: move quantity from available to committed.
     *
     * Does nothing for variants that do not track inventory.
     *
     * @since 1.0.0
     *
     * @param int $variant_id Variant ID.
     * @param int $quantity   Amount to reserve.
     * @return bool True when the quantities were updated, or the variant is untracked.
     * @throws NotFoundException When the variant does not exist.
     * @throws ValidationException When the variant lacks the stock and does not allow back orders.
     */
    public function reserve_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        /* translators: %s: variant ID */
        throw_if(empty($variant), sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $variant_id), NotFoundException::class, Response::NOT_FOUND);

        if (!$variant->track_inventory) {
            return true;
        }

        throw_if(!$variant->allow_back_order && $variant->available_quantity < $quantity, __('Insufficient stock to reserve.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        $is_reserved = $this->variant_service->increment($variant_id, 'committed_quantity', $quantity) && $this->variant_service->decrement($variant_id, 'available_quantity', $quantity);

        if ($is_reserved) {
            $this->record_stock_level_crossing($variant, $quantity);
        }

        return $is_reserved;
    }

    /**
     * Release reserved stock: move quantity from committed back to available.
     *
     * Releases at most the currently committed quantity. Does nothing for
     * variants that do not track inventory.
     *
     * @since 1.0.0
     *
     * @param int $variant_id Variant ID.
     * @param int $quantity   Amount to release.
     * @return bool True when the quantities were updated, or the variant is untracked.
     * @throws NotFoundException When the variant does not exist.
     */
    public function release_reserved_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        /* translators: %s: variant ID */
        throw_if(empty($variant), sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $variant_id), NotFoundException::class, Response::NOT_FOUND);

        if (!$variant->track_inventory) {
            return true;
        }

        $current_committed = $variant->committed_quantity;
        $release_amount = min($current_committed, $quantity);

        return $this->variant_service->decrement($variant_id, 'committed_quantity', $release_amount) && $this->variant_service->increment($variant_id, 'available_quantity', $release_amount);
    }

    /**
     * Confirm reserved stock: decrease committed quantity (e.g. order fulfilled).
     *
     * Confirms at most the currently committed quantity. Does nothing for
     * variants that do not track inventory.
     *
     * @since 1.0.0
     *
     * @param int $variant_id Variant ID.
     * @param int $quantity   Amount to confirm.
     * @return bool True when the quantity was updated, or the variant is untracked.
     * @throws NotFoundException When the variant does not exist.
     */
    public function confirm_reserved_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        /* translators: %s: variant ID */
        throw_if(empty($variant), sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $variant_id), NotFoundException::class, Response::NOT_FOUND);

        if (!$variant->track_inventory) {
            return true;
        }

        $current_committed = $variant->committed_quantity;
        $confirm_amount = min($current_committed, $quantity);

        return $this->variant_service->decrement($variant_id, 'committed_quantity', $confirm_amount);
    }

    /**
     * Release the reserved stock of every item in an order.
     *
     * @since 1.0.0
     *
     * @param Order $order Order whose items are released.
     * @return void
     */
    public function release_all_reserved_stock(Order $order)
    {
        $order->items->each(function ($item) {
            $this->release_reserved_stock($item->variant_id, $item->quantity);
        });
    }

    /**
     * Confirm the reserved stock of every item in an order.
     *
     * @since 1.0.0
     *
     * @param Order $order Order whose items are confirmed.
     * @return void
     */
    public function confirm_all_reserved_stock(Order $order)
    {
        $order->items->each(function ($item) {
            $this->confirm_reserved_stock($item->variant_id, $item->quantity);
        });
    }

    /**
     * Run a group of stock changes and send their low-stock and out-of-stock alerts together.
     *
     * Crossings recorded while the callback runs are buffered, then raised as
     * at most one low-stock and one out-of-stock event, each listing every
     * affected variant. If the callback throws, the buffer is discarded.
     *
     * @since 1.0.0
     *
     * @param callable $callback Makes the stock changes.
     * @return mixed The callback's return value.
     * @throws \Throwable Whatever the callback throws.
     */
    public function collect_stock_alerts(callable $callback)
    {
        if (!is_null($this->pending_stock_alerts)) {
            return $callback();
        }

        $this->pending_stock_alerts = ['low' => [], 'out' => []];

        try {
            $result = $callback();
            $alerts = $this->pending_stock_alerts;
        } finally {
            $this->pending_stock_alerts = null;
        }

        $this->dispatch_stock_alerts(array_values($alerts['low']), array_values($alerts['out']));

        return $result;
    }

    /**
     * Record a low-stock or out-of-stock crossing caused by a stock reduction.
     *
     * Only a crossing alerts, so further reductions below a level stay quiet
     * until the variant is restocked above it. Running out takes precedence,
     * so one variant is never in both alerts. Outside collect_stock_alerts()
     * the alert is raised straight away.
     *
     * @since 1.0.0
     *
     * @param Variant $variant  The variant as loaded before the reduction.
     * @param int     $quantity Amount the available quantity was reduced by.
     * @return void
     */
    protected function record_stock_level_crossing(Variant $variant, int $quantity)
    {
        if (!$variant->track_inventory || $quantity <= 0) {
            return;
        }

        $before = (int) $variant->available_quantity;
        $after = $before - $quantity;
        $variant_id = (int) $variant->id;
        $level = null;

        if ($before > 0 && $after <= 0) {
            $level = 'out';
        } else {
            $threshold = $this->availability_service->resolve_low_stock_threshold($variant, (int) Settings::get('product.low_stock_threshold', 0));

            if ($threshold > 0 && $before > $threshold && $after <= $threshold) {
                $level = 'low';
            }
        }

        if (is_null($level)) {
            return;
        }

        if (is_null($this->pending_stock_alerts)) {
            $this->dispatch_stock_alerts($level === 'low' ? [$variant_id] : [], $level === 'out' ? [$variant_id] : []);
            return;
        }

        if ($level === 'out') {
            unset($this->pending_stock_alerts['low'][$variant_id]);
        }

        $this->pending_stock_alerts[$level][$variant_id] = $variant_id;
    }

    /**
     * Raise the low-stock and out-of-stock events for the given variants.
     *
     * @since 1.0.0
     *
     * @param int[] $low_stock_ids    IDs of the variants that crossed their low-stock threshold.
     * @param int[] $out_of_stock_ids IDs of the variants that ran out.
     * @return void
     */
    protected function dispatch_stock_alerts(array $low_stock_ids, array $out_of_stock_ids)
    {
        if (!empty($low_stock_ids)) {
            VariantsLowStockEvent::dispatch($low_stock_ids);
        }

        if (!empty($out_of_stock_ids)) {
            VariantsOutOfStockEvent::dispatch($out_of_stock_ids);
        }
    }
}
