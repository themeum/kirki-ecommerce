<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Validates that the given value is a string.
 *
 * @since 1.0.0
 */
class StringRule extends BaseRule
{
    /**
     * check for strict data type 
     * 
     * @var bool
     */
    protected $check_strict_data_type = true;

    /**
     * Determine if the value is a string.
     *
     * @return bool
     */
    public function validate_rule()
    {
        return is_string($this->value);
    }

    /**
     * Get the error message for a non-string value.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must be of type string.', 'kirki-ecommerce'), $this->last_key_segment());
    }
}
