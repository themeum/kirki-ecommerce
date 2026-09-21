<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Decision condition that matches on the shipping destination country and states.
 *
 * @since 1.0.0
 */
class DestinationRegionCondition extends Condition
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Conditions::DESTINATION_REGION;
    }

    /**
     * Check whether the shipping address is in the target country and, when given, one of the target states.
     *
     * The operator is ignored; country and state are always matched with equality or membership.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context  Context to read from.
     * @param string          $operator Comparison operator.
     * @param mixed           $value    Value configured on the rule's condition, an array with a country (single or list) and optional state list.
     * @return bool False when the context has no shipping address or the value is empty.
     */
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
