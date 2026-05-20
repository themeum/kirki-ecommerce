<?php

namespace Kirki\Ecommerce\Validation\Rules;

use DateTime;

/**
 * Validates that the given value matches a specific date format.
 *
 * @since 1.0.0
 */
class DateFormatRule extends BaseRule
{

    /**
     * Determine if the value is a valid date in the given format.
     *
     * @return bool
     */
    public function validate_rule()
    {
        $date = DateTime::createFromFormat($this->rule_value, $this->value);
        return $date && $date->format($this->rule_value) === $this->value;
    }

    /**
     * Get the error message for invalid date format.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must be a valid date in the format %s.', 'kirki-ecommerce'), $this->last_key_segment(), $this->rule_value);
    }
}
