<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class ProductProfileCondition extends Condition
{
    public function get_type()
    {
        return Conditions::PRODUCT_PROFILE;
    }

    public function evaluate(DecisionContext $context, $operator, $value)
    {
        $profile = $context->get('product_profile');

        return $this->compare($profile, $operator, $value);
    }
}
