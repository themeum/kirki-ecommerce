<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class SetFreeShippingAction implements Action
{
    public function get_type()
    {
        return Actions::SET_FREE_SHIPPING;
    }

    public function execute(DecisionContext $context, $value)
    {
        $context->set_shipping_cost(0);
    }
}
