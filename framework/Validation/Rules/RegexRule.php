<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Validates that the given value with the given regex
 *
 * @since 1.0.0
 */
class RegexRule extends BaseRule
{
    /**
     * Determine if the value is valid based on the regex.
     *
     * @return bool
     */
    public function validate_rule()
    {
        return preg_match($this->rule_value, $this->value);
    }

    /**
     * Get the error message for invalid value.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must match the regex: %s.', 'kirki-ecommerce'), $this->last_key_segment(), $this->rule_value);
    }
}
