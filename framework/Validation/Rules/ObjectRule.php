<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Validates that a value is an object.
 *
 * @since 1.0.0
 */
class ObjectRule extends BaseRule
{
    /**
     * Check if the value is a valid object.
     *
     * @return bool
     */
    public function validate_rule()
    {
        return is_object($this->value);
    }

    /**
     * Get the error message for an invalid object value.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must be of type object.', 'kirki-ecommerce'), $this->last_key_segment());
    }
}
