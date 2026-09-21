<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Decision action that sets the product tax rate.
 *
 * @since 1.0.0
 */
class SetProductTaxRateAction implements Action
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Actions::SET_PRODUCT_TAX_RATE;
    }

    /**
     * Set the product tax rate to the value.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context Context being modified.
     * @param mixed           $value   Tax rate as a percentage.
     * @return void
     */
    public function execute(DecisionContext $context, $value)
    {
        $context->set_product_tax(floatval($value));
    }
}
