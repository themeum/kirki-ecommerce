<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class SetProductTaxExemptAction implements Action
{
    public function get_type()
    {
        return Actions::SET_PRODUCT_TAX_EXEMPT;
    }

    public function execute(DecisionContext $context, $value)
    {
        $context->set_product_tax(0);
    }
}
