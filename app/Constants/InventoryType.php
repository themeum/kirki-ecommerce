<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Concerns\HasConstants;

class InventoryType
{
    use HasConstants;
    const IN_STOCK = 'in_stock';
    const OUT_OF_STOCK = 'out_of_stock';
}
