<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Decision condition that matches on the product profile.
 *
 * @since 1.0.0
 */
class ProductProfileCondition extends Condition
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Conditions::PRODUCT_PROFILE;
    }

    /**
     * Compare the context's product profile with the value.
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
        $profile = $context->get('product_profile');

        return $this->compare($profile, $operator, $value);
    }
}
