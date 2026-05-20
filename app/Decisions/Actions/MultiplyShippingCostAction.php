<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class MultiplyShippingCostAction implements Action
{
    public function get_type()
    {
        return Actions::MULTIPLY_SHIPPING_COST;
    }

    public function execute(DecisionContext $context, $value)
    {
        $current_cost = $context->get_shipping_cost() ?: 0;
        $context->set_shipping_cost($current_cost * floatval($value));
    }
}
