<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Decision condition that matches on the shipping profiles of the cart items.
 *
 * @since 1.0.0
 */
class ShippingProfileCondition extends Condition
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Conditions::SHIPPING_PROFILE;
    }

    /**
     * Check whether any of the context's shipping profiles satisfies the comparison.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context  Context to read from.
     * @param string          $operator Comparison operator.
     * @param mixed           $value    Value configured on the rule's condition.
     * @return bool False when the context has no shipping profiles.
     */
    public function evaluate(DecisionContext $context, $operator, $value)
    {
        $shipping_profiles = $context->get('shipping_profiles');

        if (!$shipping_profiles || !is_array($shipping_profiles)) {
            return false;
        }

        foreach ($shipping_profiles as $profile) {
            if ($this->compare($profile, $operator, $value)) {
                return true;
            }
        }

        return false;
    }
}
