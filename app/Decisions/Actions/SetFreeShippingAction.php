<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Decision action that makes shipping free.
 *
 * @since 1.0.0
 */
class SetFreeShippingAction implements Action
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Actions::SET_FREE_SHIPPING;
    }

    /**
     * Set the shipping cost to zero.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context Context being modified.
     * @param mixed           $value   Unused.
     * @return void
     */
    public function execute(DecisionContext $context, $value)
    {
        $context->set_shipping_cost(0);
    }
}
