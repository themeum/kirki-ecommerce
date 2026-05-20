<?php

namespace Kirki\Ecommerce\App\DTO\PaymentMethod;

use Kirki\Ecommerce\DTO;

class CreatePaymentMethodDTO extends DTO
{
    public $id;
    public $name;
    public $icon;
    public $is_enabled;
    public $is_manual;
    public $instructions;
    public $config;
}
