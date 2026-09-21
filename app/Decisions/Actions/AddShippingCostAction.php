<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\Facades\Money;

/**
 * Decision action that adds an amount to the shipping cost.
 *
 * @since 1.0.0
 */
class AddShippingCostAction implements Action
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Actions::ADD_SHIPPING_COST;
    }

    /**
     * Add the value, converted to base currency minor units, to the current shipping cost.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context Context being modified.
     * @param mixed           $value   Amount in major currency units.
     * @return void
     */
    public function execute(DecisionContext $context, $value)
    {
        $value = Money::of(floatval($value))->getMinorAmount()->toInt();
        $current_cost = $context->get_shipping_cost() ?: 0;
        $context->set_shipping_cost($current_cost + $value);
    }
}
