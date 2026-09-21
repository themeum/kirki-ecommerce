<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Decision action that multiplies the shipping cost by a factor.
 *
 * @since 1.0.0
 */
class MultiplyShippingCostAction implements Action
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Actions::MULTIPLY_SHIPPING_COST;
    }

    /**
     * Multiply the current shipping cost by the value.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context Context being modified.
     * @param mixed           $value   Multiplier.
     * @return void
     */
    public function execute(DecisionContext $context, $value)
    {
        $current_cost = $context->get_shipping_cost() ?: 0;
        $context->set_shipping_cost($current_cost * floatval($value));
    }
}
