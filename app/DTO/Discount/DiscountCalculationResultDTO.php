<?php

namespace Kirki\Ecommerce\App\DTO\Discount;

use Kirki\Ecommerce\Framework\DTO;

class DiscountCalculationResultDTO extends DTO
{
    public $item_discounts = [];
    public $is_free_shipping = false;
    public $discount_details;
}
