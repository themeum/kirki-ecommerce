<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

class InventoryService
{
    /**
     * @var VariantService
     */
    protected $variant_service;

    /**
     * InventoryService constructor.
     *
     * @param VariantService $variant_service
     */
    public function __construct(VariantService $variant_service)
    {
        $this->variant_service = $variant_service;
    }

    /**
     * Check if sufficient stock exists.
     *
     * @param int $variant_id
     * @param int $quantity
     * @return bool
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
     * Check if within limit per order.
     *
     * @param int $variant_id
     * @param int $quantity
     * @return bool
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
     * Increase available quantity.
     *
     * @param int $variant_id
     * @param int $quantity
     * @return bool
     * @throws NotFoundException
     */
    public function increment_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        if (empty($variant)) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $variant_id), Response::NOT_FOUND);
        }

        return $this->variant_service->increment($variant_id, 'available_quantity', $quantity);
    }

    /**
     * Decrease available quantity.
     *
     * @param int $variant_id
     * @param int $quantity
     * @return bool
     * @throws NotFoundException
     * @throws ValidationException
     */
    public function decrement_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        if (empty($variant)) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $variant_id), Response::NOT_FOUND);
        }

        if ($variant->track_inventory && !$variant->allow_back_order && $variant->available_quantity < $quantity) {
            throw new ValidationException(__('Insufficient stock.', 'kirki-ecommerce'), Response::UNPROCESSABLE_ENTITY);
        }

        return $this->variant_service->decrement($variant_id, 'available_quantity', $quantity);
    }

    /**
     * Reserve stock: Move quantity from available to committed.
     *
     * @param int $variant_id
     * @param int $quantity
     * @return bool
     * @throws NotFoundException
     * @throws ValidationException
     */
    public function reserve_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        if (empty($variant)) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $variant_id), Response::NOT_FOUND);
        }

        if (!$variant->track_inventory) {
            return true;
        }

        if (!$variant->allow_back_order && $variant->available_quantity < $quantity) {
            throw new ValidationException(__('Insufficient stock to reserve.', 'kirki-ecommerce'), Response::UNPROCESSABLE_ENTITY);
        }

        return $this->variant_service->increment($variant_id, 'committed_quantity', $quantity) && $this->variant_service->decrement($variant_id, 'available_quantity', $quantity);
    }

    /**
     * Release reserved stock: Move quantity from committed back to available.
     *
     * @param int $variant_id
     * @param int $quantity
     * @return bool
     * @throws NotFoundException
     */
    public function release_reserved_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        if (empty($variant)) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $variant_id), Response::NOT_FOUND);
        }

        if (!$variant->track_inventory) {
            return true;
        }

        $current_committed = $variant->committed_quantity;
        $release_amount = min($current_committed, $quantity);

        return $this->variant_service->decrement($variant_id, 'committed_quantity', $release_amount) && $this->variant_service->increment($variant_id, 'available_quantity', $release_amount);
    }

    /**
     * Confirm reserved stock: Decrease committed quantity (e.g. order fulfilled).
     *
     * @param int $variant_id
     * @param int $quantity
     * @return bool
     * @throws NotFoundException
     */
    public function confirm_reserved_stock(int $variant_id, int $quantity)
    {
        $variant = $this->variant_service->find_or_null($variant_id);

        if (empty($variant)) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $variant_id), Response::NOT_FOUND);
        }

        if (!$variant->track_inventory) {
            return true;
        }

        $current_committed = $variant->committed_quantity;
        $confirm_amount = min($current_committed, $quantity);

        return $this->variant_service->decrement($variant_id, 'committed_quantity', $confirm_amount);
    }

    /**
     * Release all reserved stock for an order.
     *
     * @param Order $order
     * @return void
     */
    public function release_all_reserved_stock(Order $order)
    {
        $order->items->each(function ($item) {
            $this->release_reserved_stock($item->variant_id, $item->quantity);
        });
    }

    /**
     * Confirm all reserved stock for an order.
     *
     * @param Order $order
     * @return void
     */
    public function confirm_all_reserved_stock(Order $order)
    {
        $order->items->each(function ($item) {
            $this->confirm_reserved_stock($item->variant_id, $item->quantity);
        });
    }
}
