<?php

namespace Kirki\Ecommerce\Validation\Rules;

use Kirki\Ecommerce\Validation\Constants\Validation;

/**
 * Rule to ensure the minium value.
 *
 * @since 1.0.0
 */
class MinRule extends BaseRule
{
    /**
     * Check if the value is valid.
     *
     * @return bool
     */
    public function validate_rule()
    {
        if ($this->is_string_value()) {
            return strlen($this->value) >= $this->rule_value;
        } elseif ($this->is_array_value()) {
            return count($this->value) >= $this->rule_value;
        }

        return $this->value >= $this->rule_value;
    }

    /**
     * Get the error message if the value is less than the min value.
     *
     * @return string
     */
    public function get_error_message()
    {
        if ($this->is_string_value()) {
            return sprintf(__('The %s field must be greater than or equal to %s characters.', 'kirki-ecommerce'), $this->last_key_segment(), $this->rule_value);
        } elseif ($this->is_array_value()) {
            return sprintf(__('The %s field must be greater than or equal to %s items.', 'kirki-ecommerce'), $this->last_key_segment(), $this->rule_value);
        }

        return sprintf(__('The %s field must be greater than or equal %s.', 'kirki-ecommerce'), $this->last_key_segment(), $this->rule_value);
    }

    protected function is_string_value()
    {
        $is_string = in_array('string', $this->all_applied_rules, true) || in_array(Validation::RULE_MAP['string'], $this->all_applied_rules, true);

        return $is_string || (is_string($this->value) && !is_numeric($this->value));
    }

    protected function is_array_value()
    {
        $is_array = in_array('array', $this->all_applied_rules, true) || in_array(Validation::RULE_MAP['array'], $this->all_applied_rules, true);

        return $is_array || is_array($this->value);
    }
}
