<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class CartWeightCondition extends Condition
{
    public function get_type()
    {
        return Conditions::CART_WEIGHT;
    }

    public function evaluate(DecisionContext $context, $operator, $value)
    {
        $cart_weight = $context->get('cart_weight');

        return $this->compare($cart_weight, $operator, $value);
    }
}
