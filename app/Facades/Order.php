<?php

namespace Kirki\Ecommerce\App\Facades;

use Kirki\Ecommerce\Facade;
use Kirki\Ecommerce\App\Managers\OrderManager;

/**
 * @method static \Kirki\Ecommerce\App\Models\Order create(\Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO $dto)
 * @method static \Kirki\Ecommerce\App\Models\Order update(\Kirki\Ecommerce\App\DTO\Order\UpdateOrderPayloadDTO $dto)
 * @method static bool mark_as_completed(int $id)
 * @method static bool mark_as_cancelled(int $id)
 * @method static bool mark_as_refunded(int $id)
 * @method static bool mark_as_pending(int $id)
 * @method static bool mark_as_processing(int $id)
 * @method static bool mark_as_on_hold(int $id)
 * @method static bool mark_payment_as_paid(int $id)
 * @method static bool mark_payment_as_failed(int $id)
 * @method static bool mark_payment_as_refunded(int $id)
 * @method static bool mark_payment_as_pending(int $id)
 * @method static bool mark_payment_as_processing(int $id)
 * @method static bool mark_payment_as_on_hold(int $id)
 * @method static bool update_payment_status(int $id, string $status)
 * @method static \Kirki\Ecommerce\App\Models\Order|null find(int $id)
 * @method static \Kirki\Ecommerce\App\Models\Order find_or_fail(int $id)
 * @method static \Kirki\Ecommerce\App\Models\Order|null find_by_uuid(string $uuid)
 * @method static \Kirki\Ecommerce\App\Models\Order|null find_by_transaction_id(string $transaction_id)
 * @method static bool delete(int $id)
 * @method static bool delete_or_fail(int $id)
 * @method static bool set_transaction_id(int $id, string $transaction_id)
 * @method static bool set_payment_gateway_fee(int $id, int $fee)
 * @method static \Kirki\Ecommerce\App\Models\Order create_refund(\Kirki\Ecommerce\App\DTO\Refund\CreateRefundPayloadDTO $dto)
 * @method static \Kirki\Ecommerce\App\Models\Order update_refund(\Kirki\Ecommerce\App\DTO\Refund\UpdateRefundPayloadDTO $dto)
 * @method static \Kirki\Ecommerce\App\Models\Order get_refund(\Kirki\Ecommerce\App\Models\Order $order, int $id)
 *
 * @see \Kirki\Ecommerce\App\Managers\OrderManager
 */
class Order extends Facade
{
    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    public static function get_accessor()
    {
        return OrderManager::class;
    }
}
