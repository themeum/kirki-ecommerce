<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class CartSubtotalCondition extends Condition
{
    public function get_type()
    {
        return Conditions::CART_SUBTOTAL;
    }

    public function evaluate(DecisionContext $context, $operator, $value)
    {
        $cart_subtotal = $context->get('cart_subtotal');

        return $this->compare($cart_subtotal, $operator, $value);
    }
}
