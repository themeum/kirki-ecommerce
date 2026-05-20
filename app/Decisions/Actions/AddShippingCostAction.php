<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\Supports\Facades\Money;

class AddShippingCostAction implements Action
{
    public function get_type()
    {
        return Actions::ADD_SHIPPING_COST;
    }

    public function execute(DecisionContext $context, $value)
    {
        $value = Money::of(floatval($value))->getMinorAmount()->toInt();
        $current_cost = $context->get_shipping_cost() ?: 0;
        $context->set_shipping_cost($current_cost + $value);
    }
}
