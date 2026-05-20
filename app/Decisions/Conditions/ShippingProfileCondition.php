<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class ShippingProfileCondition extends Condition
{
    public function get_type()
    {
        return Conditions::SHIPPING_PROFILE;
    }

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
