<?php

namespace Kirki\Ecommerce\App\DTO\OfflinePayment;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for updating an offline payment method.
 *
 * @since 1.0.0
 */
class UpdateOfflinePaymentDTO extends DTO
{
    /** @var string */
    public $id;
    /** @var string */
    public $name;
    /** @var int|string|null Media attachment ID of the payment method icon. */
    public $icon;
    /** @var bool|null */
    public $is_enabled;
    /** @var bool|null */
    public $is_offline;
    /** @var string|null Shown as the payment method description. */
    public $instructions;
    /** @var array|null */
    public $config;
}
