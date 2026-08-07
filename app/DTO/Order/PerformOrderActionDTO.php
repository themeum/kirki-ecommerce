<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;

class PerformOrderActionDTO extends DTO
{
    /**
     * @var int
     */
    public $order_id;

    /**
     * @var string
     */
    public $action;

    /**
     * @var int|null
     */
    public $refund_id;

    /**
     * @var int|null
     */
    public $amount;

    /**
     * @var string|null
     */
    public $carrier;

    /**
     * @var string|null
     */
    public $tracking_number;

    /**
     * @var string|null
     */
    public $tracking_url;

    /**
     * @var string|null
     */
    public $reason;

    /**
     * @var string|null
     */
    public $payment_method;

    /**
     * @var int|null
     */
    public $updated_by;
}
