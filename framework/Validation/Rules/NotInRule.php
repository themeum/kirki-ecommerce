<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Rule to ensure a value does not exists within a predefined set.
 *
 * @since 1.0.0
 */
class NotInRule extends BaseRule
{
    /**
     * Check if the value is in the allowed list.
     *
     * @return bool
     */
    public function validate_rule()
    {
        $not_in = $this->rule_value;

        if (is_string($not_in)) {
            $not_in = str_replace(' ', '', $not_in);
            $not_in = explode(',', $not_in);
        }

        return !in_array($this->value, $not_in);
    }

    /**
     * Get the error message if the value is in the not allowed list.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must not contain a value from: %s.', 'kirki-ecommerce'), $this->last_key_segment(), $this->rule_value);
    }
}
