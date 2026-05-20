<?php

namespace Kirki\Ecommerce\Validation\Rules;

use Kirki\Ecommerce\Contracts\Rule;

/**
 * Abstract base class for validation rules.
 *
 * @since 1.0.0
 */
abstract class BaseRule implements Rule
{
    /**
     * check for strict data type 
     * 
     * @var bool
     */
    protected $check_strict_data_type = false;


    /**
     * The field key being validated.
     *
     * @var string|null
     */
    protected $key;

    /**
     * The value to validate.
     *
     * @var mixed
     */
    protected $value;

    /**
     * The value/values for specific rule.
     *
     * @var mixed
     */
    protected $rule_value;

    /**
     * All applied rules for validation.
     *
     * @var mixed
     */
    protected $all_applied_rules;

    /**
     * The input data.
     *
     * @var array
     */
    protected $data;

    /**
     * Create a new rule instance.
     *
     * @param string|null $key   The field name.
     * @param mixed       $value The value to validate.
     * @param mixed       $rule_value The value to that can be passed to the rule.
     * @param array       $data  The input data.
     * @param array       $all_applied_rules  All applied rules
     */
    public function __construct($key = null, $value = null, $rule_value = null, $data = [], $all_applied_rules = [])
    {
        $this->key = $key;
        $this->value = $value;
        $this->rule_value = $rule_value;
        $this->data = $data;
        $this->all_applied_rules = $all_applied_rules;
    }

    /**
     * Set the field key.
     *
     * @param string $key
     * @return void
     */
    public function set_key(string $key)
    {
        $this->key = $key;
    }

    /**
     * Set the value to validate.
     *
     * @param mixed $value
     * @return void
     */
    public function set_value($value)
    {
        $this->value = $value;
    }

    /**
     * Get the value.
     *
     * @return string
     */
    public function get_value()
    {
        return $this->value;
    }

    /**
     * Check if the rule is for a specific data type.
     * 
     * @return bool
     */
    public function is_check_strict_data_type()
    {
        return $this->check_strict_data_type;
    }

    /**
     * Determine if the value is valid.
     *
     * @return bool
     */
    public function is_valid()
    {
        if ($this->ignore_rule_check()) {
            return true;
        }

        return $this->validate_rule();
    }

    /**
     * ignore rule check if value is empty
     * 
     * @return bool
     */
    protected function ignore_rule_check()
    {
        return $this->value === null;
    }

    /**
     * Get the last key segment.
     * @return string
     */
    protected function last_key_segment()
    {
        $parts = explode('.', $this->key);

        return $parts[count($parts) - 1];
    }

    /**
     * Validate the rule with desired value.
     * @return bool
     */
    abstract public function validate_rule();

    /**
     * Get the error message for this rule.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The value provided for %s is invalid.', 'kirki-ecommerce'), $this->last_key_segment());
    }
}
