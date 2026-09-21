<?php

namespace Kirki\Ecommerce\App\DTO\Refund;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Input payload for creating a refund against an order.
 *
 * @since 1.0.0
 */
class CreateRefundPayloadDTO extends DTO
{
    /** @var int */
    public $order_id;

    /** @var float */
    public $invoiced_amount;

    /** @var string|null */
    public $reason;

    /** @var int */
    public $created_by;
}
