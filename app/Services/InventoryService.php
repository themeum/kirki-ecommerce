<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Order;
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

    /**
     * Set up the service with the variant service.
     *
     * @since 1.0.0
     *
     * @param VariantService $variant_service Variant lookup and quantity updates.
     */
    public function __construct(VariantService $variant_service)
    {
        $this->variant_service = $variant_service;
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

        return $this->variant_service->decrement($variant_id, 'available_quantity', $quantity);
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

        return $this->variant_service->increment($variant_id, 'committed_quantity', $quantity) && $this->variant_service->decrement($variant_id, 'available_quantity', $quantity);
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
}
