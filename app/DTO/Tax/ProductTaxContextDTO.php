<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

use Kirki\Ecommerce\Framework\DTO;

class ProductTaxContextDTO extends DTO
{
    /**
     * @var array
     */
    public $shipping_address;

    /**
     * @var array
     */
    public $billing_address;

    /**
     * @var int
     */
    public $base_product_price;

    /**
     * @var array|null
     */
    public $product_categories;

    /**
     * @var string|null
     */
    public $tax_profile;
}
