<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Decision action that disables the shipping method.
 *
 * @since 1.0.0
 */
class DisableShippingMethodAction implements Action
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Actions::DISABLE_SHIPPING_METHOD;
    }

    /**
     * Mark the shipping method as disabled.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context Context being modified.
     * @param mixed           $value   Unused.
     * @return void
     */
    public function execute(DecisionContext $context, $value)
    {
        $context->set_disabled(true);
    }
}
