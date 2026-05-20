<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Validates that the given value is a float.
 *
 * @since 1.0.0
 */
class FloatRule extends BaseRule
{
    /**
     * check for strict data type 
     * 
     * @var bool
     */
    protected $check_strict_data_type = true;

    /**
     * Determine if the value is a float.
     *
     * @return bool
     */
    public function validate_rule()
    {
        return !(filter_var($this->value, FILTER_VALIDATE_FLOAT) === false);
    }

    /**
     * Get the error message for a non-float value.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must be of type float.', 'kirki-ecommerce'), $this->last_key_segment());
    }
}
