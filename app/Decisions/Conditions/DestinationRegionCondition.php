<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

defined('ABSPATH') || exit;

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
     * Country and state are matched with equality or membership; the "!=" operator negates that match.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context  Context to read from.
     * @param string          $operator Comparison operator, "!=" negates the match and any other value keeps it.
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

        $matches = $this->matches_destination($shipping_address, $value);

        return $operator === '!=' ? !$matches : $matches;
    }

    /**
     * Check whether the shipping address is in the target country and, when given, one of the target states.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $shipping_address Shipping address from the context.
     * @param array<string, mixed> $value            Target country (single or list) and optional state list.
     * @return bool
     */
    protected function matches_destination(array $shipping_address, array $value)
    {
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
