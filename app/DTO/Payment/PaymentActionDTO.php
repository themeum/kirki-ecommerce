<?php

namespace Kirki\Ecommerce\App\DTO\Payment;

use Kirki\Ecommerce\Framework\DTO;

class PaymentActionDTO extends DTO
{
    /** @var string */
    public $type;

    /** @var string */
    public $value;
}
