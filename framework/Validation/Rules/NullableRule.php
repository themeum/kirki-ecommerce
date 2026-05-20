<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Validates that a value is present and null.
 *
 * @since 1.0.0
 */
class NullableRule extends BaseRule
{
    /**
     * check for strict data type 
     * 
     * @var bool
     */
    protected $check_strict_data_type = true;

    /**
     * Determine if the value is present and can be null.
     *
     * @return bool
     */
    public function validate_rule()
    {
        return is_null($this->value) || $this->value === '';
    }

    /**
     * Get the error message for a missing required field.
     *
     * @return string
     */
    public function get_error_message()
    {
        return '';
    }
}
