<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Validates that the given value is a boolean.
 *
 * @since 1.0.0
 */
class BooleanRule extends BaseRule
{
    /**
     * check for strict data type 
     * 
     * @var bool
     */
    protected $check_strict_data_type = true;

    /**
     * Determine if the value is a boolean.
     *
     * @return bool
     */
    public function validate_rule()
    {
        $value = $this->value;

        // Normalize string values that represent booleans
        if (is_string($value)) {
            $value = strtolower($value);
            return in_array($value, ['true', 'false', '1', '0'], true);
        }

        // Accept actual booleans and integer equivalents
        if (is_bool($value) || $value === 1 || $value === 0) {
            return true;
        }

        return false;
    }

    /**
     * Get the error message for a non-boolean value.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must be of type boolean.', 'kirki-ecommerce'), $this->last_key_segment());
    }
}
