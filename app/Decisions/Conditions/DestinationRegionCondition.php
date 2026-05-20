<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class DestinationRegionCondition extends Condition
{
    public function get_type()
    {
        return Conditions::DESTINATION_REGION;
    }

    public function evaluate(DecisionContext $context, $operator, $value)
    {
        $shipping_address = $context->get('shipping_address');

        if (!$shipping_address || !is_array($shipping_address)) {
            return false;
        }

        if (empty($value) || !is_array($value)) {
            return false;
        }

        return $this->compare($shipping_address['country'], '=', $value['country']) && $this->compare($shipping_address['state'], 'in', $value['state']);
    }
}
