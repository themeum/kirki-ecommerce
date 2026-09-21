<?php

namespace Kirki\Ecommerce\App\DTO\Payment;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for a payment action: a type and its value.
 *
 * @since 1.0.0
 */
class PaymentActionDTO extends DTO
{
    /** @var string */
    public $type;

    /** @var string */
    public $value;
}
