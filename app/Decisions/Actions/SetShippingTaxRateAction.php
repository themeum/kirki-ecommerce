<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class SetShippingTaxRateAction implements Action
{
    public function get_type()
    {
        return Actions::SET_SHIPPING_TAX_RATE;
    }

    public function execute(DecisionContext $context, $value)
    {
        $context->set_product_tax(floatval($value));
    }
}
