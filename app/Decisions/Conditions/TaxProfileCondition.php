<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Decision condition that matches on the tax profile.
 *
 * @since 1.0.0
 */
class TaxProfileCondition extends Condition
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Conditions::TAX_PROFILE;
    }

    /**
     * Compare the context's tax profile with the value.
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
        $profile = $context->get('tax_profile');

        return $this->compare($profile, $operator, $value);
    }
}
