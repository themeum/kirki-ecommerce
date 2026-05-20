<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Validates that a value is present and not null.
 *
 * @since 1.0.0
 */
class ProhibitedIfRule extends BaseRule
{
    /**
     * Determine if the value is present.
     *
     * @return bool
     */
    public function validate_rule()
    {
        $field_and_value = explode(',', $this->rule_value, 2);
        $field = $field_and_value[0];
        $value = $field_and_value[1];

        if ($value === 'false' || $value === 'FALSE') {
            $value = false;
        } elseif ($value === 'true' || $value === 'TRUE') {
            $value = true;
        } elseif ($value === 'null' || $value === 'NULL') {
            $value = null;
        }

        if (array_key_exists($field, $this->data) && $this->data[$field] == $value) {
            return is_null($this->value) || $this->value === '';
        }

        return true;
    }

    /**
     * Get the error message for the prohibited field.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field is prohibited.', 'kirki-ecommerce'), $this->last_key_segment());
    }

    protected function ignore_rule_check()
    {
        return false;
    }
}
