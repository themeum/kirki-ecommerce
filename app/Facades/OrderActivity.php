<?php

namespace Kirki\Ecommerce\App\Facades;

use Kirki\Ecommerce\Framework\Facade;
use Kirki\Ecommerce\App\Managers\OrderActivityManager;

/**
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity order_placed(\Kirki\Ecommerce\App\Models\Order $order)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity payment_completed(\Kirki\Ecommerce\App\Models\Order $order, string|null $provider = null)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity payment_failed(\Kirki\Ecommerce\App\Models\Order $order)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity processing(\Kirki\Ecommerce\App\Models\Order $order)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity fulfillment_resumed(\Kirki\Ecommerce\App\Models\Order $order)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity shipped(\Kirki\Ecommerce\App\Models\Order $order)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity delivered(\Kirki\Ecommerce\App\Models\Order $order)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity cancelled(\Kirki\Ecommerce\App\Models\Order $order, string|null $reason = null)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity tracking_added(\Kirki\Ecommerce\App\Models\Order $order, array $tracking)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity archived(\Kirki\Ecommerce\App\Models\Order $order)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity on_hold(\Kirki\Ecommerce\App\Models\Order $order)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity partially_refunded(\Kirki\Ecommerce\App\Models\Order $order, \Kirki\Ecommerce\App\Models\Refund $refund)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity refunded(\Kirki\Ecommerce\App\Models\Order $order, \Kirki\Ecommerce\App\Models\Refund $refund)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity refund_requested(\Kirki\Ecommerce\App\Models\Order $order, \Kirki\Ecommerce\App\Models\Refund $refund)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity refund_deleted(\Kirki\Ecommerce\App\Models\Order $order, array $refund_snapshot)
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity comment(int $order_id, string $message, int|null $created_by = null)
 * @method static string describe(\Kirki\Ecommerce\App\Models\OrderActivity $activity)
 *
 * @see \Kirki\Ecommerce\App\Managers\OrderActivityManager
 */
class OrderActivity extends Facade
{
    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    public static function get_accessor()
    {
        return OrderActivityManager::class;
    }
}
