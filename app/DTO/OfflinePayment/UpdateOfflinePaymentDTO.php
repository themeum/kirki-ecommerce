<?php

namespace Kirki\Ecommerce\App\DTO\OfflinePayment;

use Kirki\Ecommerce\Framework\DTO;

class UpdateOfflinePaymentDTO extends DTO
{
    public $id;
    public $name;
    public $icon;
    public $is_enabled;
    public $is_offline;
    public $instructions;
    public $config;
}
