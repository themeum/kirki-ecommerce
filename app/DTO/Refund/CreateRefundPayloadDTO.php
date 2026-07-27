<?php

namespace Kirki\Ecommerce\App\DTO\Refund;

use Kirki\Ecommerce\Framework\DTO;

class CreateRefundPayloadDTO extends DTO
{
    /**
     * @var int
     */
    public $order_id;

    /**
     * @var float
     */
    public $amount;

    /**
     * @var string|null
     */
    public $reason;

    /**
     * @var int
     */
    public $created_by;
}
