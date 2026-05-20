<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Rule to ensure a value exists within a predefined set.
 *
 * @since 1.0.0
 */
class InRule extends BaseRule
{
    /**
     * Check if the value is in the allowed list.
     *
     * @return bool
     */
    public function validate_rule()
    {
        $in = $this->rule_value;

        if (is_string($in)) {
            $in = str_replace(' ', '', $in);
            $in = explode(',', $in);
        }

        return in_array($this->value, $in);
    }

    /**
     * Get the error message if the value is not in the allowed list.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must contain a value from: %s.', 'kirki-ecommerce'), $this->last_key_segment(), $this->rule_value);
    }
}
