<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds PayMongo checkout session request payloads for an order.
 */
class PayfastTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order to build PayMongo payloads for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }
}
