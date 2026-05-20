<?php

namespace Kirki\Ecommerce\App\DTO\Refund;

use Kirki\Ecommerce\DTO;

class UpdateRefundPayloadDTO extends DTO
{
    /**
     * @var int
     */
    public $id;

    /**
     * @var int
     */
    public $order_id;

    /**
     * @var string
     */
    public $status;

    /**
     * @var string|null
     */
    public $reason;

    /**
     * @var string|null
     */
    public $refund_id;

    /**
     * @var int|null
     */
    public $updated_by;
}
