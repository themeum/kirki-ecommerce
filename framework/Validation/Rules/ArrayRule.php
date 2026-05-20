<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Validates that a value is an array.
 *
 * @since 1.0.0
 */
class ArrayRule extends BaseRule
{
    /**
     * check for strict data type 
     * 
     * @var bool
     */
    protected $check_strict_data_type = true;

    /**
     * Check if the value is a valid array.
     *
     * @return bool
     */
    public function validate_rule()
    {
        return is_array($this->value);
    }

    /**
     * Get the error message for an invalid array value.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must be of type array.', 'kirki-ecommerce'), $this->last_key_segment());
    }
}
