<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\Supports\Facades\Money;

class SetShippingCostAction implements Action
{
    public function get_type()
    {
        return Actions::SET_SHIPPING_COST;
    }

    public function execute(DecisionContext $context, $value)
    {
        $value = Money::of(floatval($value))->getMinorAmount()->toInt();
        $context->set_shipping_cost($value);
    }
}
