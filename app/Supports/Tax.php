<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Tax\Strategies\AbstractTaxStrategy;
use Kirki\Ecommerce\App\Tax\TaxStrategyFactory;
use Throwable;

class Tax
{
    /**
     * Get tax strategy for a given address.
     * 
     * @param array $address
     * 
     * @return AbstractTaxStrategy|null
     */
    public static function get_tax_strategy($address)
    {
        if (empty($address)) {
            return null;
        }

        try {
            return TaxStrategyFactory::make($address);
        } catch (Throwable $e) {
            return null;
        }
    }
}
