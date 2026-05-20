<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class DisableShippingMethodAction implements Action
{
    public function get_type()
    {
        return Actions::DISABLE_SHIPPING_METHOD;
    }

    public function execute(DecisionContext $context, $value)
    {
        $context->set_disabled(true);
    }
}
