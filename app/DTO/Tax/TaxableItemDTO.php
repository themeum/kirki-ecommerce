<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

use Kirki\Ecommerce\Framework\DTO;

class TaxableItemDTO extends DTO
{
    /**
     * @var int|string
     */
    public $item_id;

    /**
     * @var int
     */
    public $taxable_amount;

    /**
     * @var int|null
     */
    public $tax_profile_id;

    /**
     * @var array
     */
    public $product_categories = [];
}
