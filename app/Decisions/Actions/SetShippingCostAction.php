<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\Facades\Money;

/**
 * Decision action that sets a fixed shipping cost.
 *
 * @since 1.0.0
 */
class SetShippingCostAction implements Action
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Actions::SET_SHIPPING_COST;
    }

    /**
     * Set the shipping cost to the value, converted to base currency minor units.
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
        $context->set_shipping_cost($value);
    }
}
