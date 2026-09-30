<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\Facades\Money;

/**
 * Decision condition that compares the cart subtotal.
 *
 * @since 1.0.0
 */
class CartSubtotalCondition extends Condition
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Conditions::CART_SUBTOTAL;
    }

    /**
     * Compare the context's base cart subtotal with the value.
     *
     * The subtotal is held in minor units while the rule's value is entered in
     * major units, so the value is converted before comparing.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context  Context to read from.
     * @param string          $operator Comparison operator.
     * @param mixed           $value    Value configured on the rule's condition.
     * @return bool
     */
    public function evaluate(DecisionContext $context, $operator, $value)
    {
        $cart_subtotal = $context->get('base_cart_subtotal');

        $base_value = Money::of(floatval($value))->getMinorAmount()->toInt();

        return $this->compare($cart_subtotal, $operator, $base_value);
    }
}
