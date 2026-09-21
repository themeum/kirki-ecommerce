<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Decision action that exempts products from tax.
 *
 * @since 1.0.0
 */
class SetProductTaxExemptAction implements Action
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Actions::SET_PRODUCT_TAX_EXEMPT;
    }

    /**
     * Set the product tax rate to zero.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context Context being modified.
     * @param mixed           $value   Unused.
     * @return void
     */
    public function execute(DecisionContext $context, $value)
    {
        $context->set_product_tax(0);
    }
}
