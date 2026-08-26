<?php

namespace Kirki\Ecommerce\App\Facades;

use Kirki\Ecommerce\Framework\Facade;
use Kirki\Ecommerce\App\Managers\OrderActivityManager;

/**
 * @method static \Kirki\Ecommerce\App\Models\OrderActivity log(\Kirki\Ecommerce\App\Models\Order $order, string $activity_type)
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
