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

        $target_country = $value['country'] ?? null;
        $target_states = $value['state'] ?? [];

        $country_matches = is_array($target_country)
            ? $this->compare($shipping_address['country'] ?? null, 'in', $target_country)
            : $this->compare($shipping_address['country'] ?? null, '=', $target_country);

        if (!$country_matches) {
            return false;
        }

        if (empty($target_states)) {
            return true;
        }

        return $this->compare($shipping_address['state'] ?? null, 'in', (array) $target_states);
    }
}
