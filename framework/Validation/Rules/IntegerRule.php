<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Validates that a value is an integer.
 *
 * @since 1.0.0
 */
class IntegerRule extends BaseRule
{
    /**
     * check for strict data type 
     * 
     * @var bool
     */
    protected $check_strict_data_type = true;

    /**
     * Check if the value is a valid integer.
     *
     * @return bool
     */
    public function validate_rule()
    {
        return filter_var($this->value, FILTER_VALIDATE_INT) !== false;
    }

    /**
     * Get the error message for an invalid integer value.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must be of type integer.', 'kirki-ecommerce'), $this->last_key_segment());
    }
}
