<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Repositories\OrderRepository;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\Order\OrderListFilterDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderItemDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

class OrderService
{
    protected $repository;

    public function __construct(OrderRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get all orders with optional search and sorting.
     *
     * @param OrderListFilterDTO $filter_dto
     * @return Collection
     */
    public function all_orders(OrderListFilterDTO $filter_dto)
    {
        return $this->repository->all($filter_dto->to_array());
    }


    /**
     * Return paginated brands
     *
     * @param OrderListFilterDTO $filters
     * @return Paginator
     */
    public function paginated_orders(OrderListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Create a new order.
     *
     * @param CreateOrderDTO $dto
     * @return Order
     */
    public function create_order(CreateOrderDTO $dto)
    {
        $order = $this->repository->create_order($dto->to_array());
        return $order;
    }

    /**
     * Create a new order item.
     *
     * @param CreateOrderItemDTO $dto
     * @return OrderItem
     */
    public function create_order_item(CreateOrderItemDTO $dto)
    {
        $order_item = $this->repository->create_order_item($dto->to_array());
        return $order_item;
    }

    /**
     * Update an order item by ID.
     *
     * @param UpdateOrderItemDTO $dto
     * @return bool
     */
    public function update_order_item(UpdateOrderItemDTO $dto)
    {
        return $this->repository->update_order_item($dto->id, $dto->to_array());
    }

    /**
     * Delete an order item by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete_order_item($id)
    {
        return $this->repository->delete_order_item($id);
    }

    /**
     * Find an order by UUID.
     *
     * @param string $uuid
     * @return Order|null
     */
    public function find_order_by_uuid($uuid)
    {
        return $this->repository->find_by_uuid($uuid);
    }

    /**
     * Find an order by transaction ID.
     *
     * @param string $transaction_id
     * @return Order|null
     */
    public function find_order_by_transaction_id($transaction_id)
    {
        return $this->repository->find_by_transaction_id($transaction_id);
    }

    /**
     * Find an order by ID.
     *
     * @param int $id
     * @return Order|null
     */
    public function find_order($id)
    {
        return $this->repository->find($id);
    }

    /**
     * Find an order by ID or throw an exception.
     *
     * @param int $id
     * @return Order
     *
     * @throws NotFoundException
     */
    public function find_order_or_fail($id)
    {
        $order = $this->find_order($id);

        if (!$order) {
            throw new NotFoundException(__('Order not found.', 'kirki-ecommerce'));
        }

        return $order;
    }

    /**
     * Update an order by ID.
     *
     * @param UpdateOrderDTO $dto
     * @return bool
     */
    public function update_order(UpdateOrderDTO $dto)
    {
        return $this->repository->update($dto->id, $dto->to_array());
    }

    /**
     * Partial update an order by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function partial_update_order(int $id, array $data)
    {
        return $this->repository->update($id, $data);
    }

    /**
     * Update an order status by ID.
     *
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function update_order_status(int $id, string $status)
    {
        return $this->repository->update_order_status($id, $status);
    }

    /**
     * Update an order payment status by ID.
     *
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function update_payment_status(int $id, string $status)
    {
        return $this->repository->update_payment_status($id, $status);
    }

    /**
     * Delete an order by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete_order($id)
    {
        return $this->repository->delete($id);
    }

    /**
     * Delete an order by ID or throw an exception.
     *
     * @param int $id
     * @return bool
     *
     * @throws NotFoundException
     */
    public function delete_order_or_fail($id)
    {
        $result = $this->delete_order($id);

        if (!$result) {
            throw new NotFoundException(__('Order not found.', 'kirki-ecommerce'));
        }

        return $result;
    }

    /**
     * Deletes multiple orders by their IDs.
     *
     * @param array $ids The IDs of the orders to delete.
     * @return bool True if the orders were deleted successfully, false otherwise.
     * @throws NotFoundException If the orders could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        if (empty($ids)) {
            throw new NotFoundException(__('No orders selected.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new NotFoundException(__('Orders could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes all orders.
     *
     * @param OrderListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(OrderListFilterDTO $filters)
    {
        return $this->repository->delete_all($filters->to_array());
    }
}
