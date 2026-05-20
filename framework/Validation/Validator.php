<?php

namespace Kirki\Ecommerce\Validation;

use Kirki\Ecommerce\Validation\Constants\Validation;
use Kirki\Ecommerce\Contracts\Rule;
use Kirki\Ecommerce\Exceptions\InvalidValidationRuleException;
use Kirki\Ecommerce\Exceptions\ValidationException;
use Kirki\Ecommerce\Validation\Rules\BaseRule;
use Closure;
use InvalidArgumentException;

/**
 * Handles data validation against defined rules.
 *
 * @since 1.0.0
 */
class Validator
{
    /**
     * The input data to validate.
     *
     * @var array
     */
    protected $data = [];

    /**
     * The validated data after passing all rules.
     *
     * @var array
     */
    protected $validated_data = [];

    /**
     * The validation rules for the data.
     *
     * @var array
     */
    protected $rules = [];

    /**
     * The errors encountered during validation.
     *
     * @var array
     */
    protected $errors = [];

    /**
     * Create a new Validator instance.
     *
     * @param array $data  The input data.
     * @param array $rules The validation rules.
     */
    public function __construct(array $data, array $rules)
    {
        $this->data = $data;
        $this->rules = $rules;
    }

    /**
     * Static factory method for creating a Validator instance.
     *
     * @param array $data
     * @param array $rules
     * @return static
     */
    public static function make(array $data, array $rules)
    {
        return new static($data, $rules);
    }

    /**
     * apply if we need to validate a field rules if the callback is resolved.
     *
     * @param string|array $field   The fields to validate
     * @param string $rules         The validation rules to applied if $callback returns true.
     * @param callable $callback    The callback to check if the field should be validated
     *
     * @return static
     */
    public function apply_if($field, string $rules, callable $callback)
    {
        if (empty($field) || empty($rules)) {
            throw new InvalidArgumentException('Field and rules are required for sometimes validation.');
        }

        if (!is_array($field)) {
            $field = [$field];
        }

        if (!$callback($this->data)) {
            return $this;
        }

        foreach ($field as $item) {
            $this->rules[$item] = $rules;
        }

        return $this;
    }

    /**
     * Determine if the data passed validation.
     *
     * @return bool
     */
    public function is_valid()
    {
        $this->run_validation();
        return empty($this->errors);
    }

    /**
     * Determine if the validation failed
     *
     * @return bool
     */
    public function is_failed()
    {
        $this->run_validation();
        return !empty($this->errors);
    }

    /**
     * Validate the data against the defined rules.
     *
     * @return bool
     * @throws ValidationException
     */
    public function validate()
    {
        if ($this->is_failed()) {
            throw ValidationException::with_errors($this->errors);
        }

        return true;
    }

    /**
     * Get the validated data.
     *
     * @return array
     */
    public function validated()
    {
        return $this->validated_data;
    }

    /**
     * Get validation errors, if any.
     *
     * @return array|null
     */
    public function get_errors()
    {
        return !empty($this->errors) ? $this->errors : null;
    }

    /**
     * Run validation on the data using defined rules.
     *
     * @return void
     */
    protected function run_validation()
    {
        foreach ($this->rules as $field => $field_rules) {
            if (is_string($field_rules)) {
                $field_rules = explode('|', $field_rules);
            }

            $key_segments = explode('.', $field);
            $this->traverse_and_validate($this->data, $key_segments, [], $field_rules);
        }
    }

    /**
     * Recursively traverses the input data structure according to a dot-notated rule key,
     * handling wildcard segments (e.g., *) to apply validation rules at dynamic levels.
     *
     * @param mixed $current_data               The current level of data being inspected. This is a portion
     *                                          of the original data array.
     *
     * @param array $key_segments               The remaining parts (split by '.') of the rule key that
     *                                          still need to be resolved. e.g. 'items.*.id' would be  ['items', '*', 'id']
     *
     * @param array $traversed_path_stack       The stack of key_segments already traversed so far. This is used
     *                                          to reconstruct the current dot-notated key (e.g., 'items.0.id')
     *                                          for both error messages and setting validated values.
     *
     * @param array $rules                      An array of validation rules to apply (e.g., ['required', 'string']).
     *                                          These are parsed from the rule string and passed into the validation
     *                                          functions.
     * @return void
     */
    protected function traverse_and_validate($current_data, $key_segments, $traversed_path_stack, $rules)
    {
        // when all segments have been traversed
        if (empty($key_segments)) {
            $traversed_key = implode('.', $traversed_path_stack);
            $this->apply_rules($rules, $traversed_key, $current_data);

            return;
        }

        $segment = array_shift($key_segments);

        if ($segment === '*') {
            if (is_null($current_data)) {
                return;
            }

            if (!is_array($current_data)) {
                $traversed_key = implode('.', $traversed_path_stack);
                $this->errors[$traversed_key][] = sprintf(__('Expected an array at "%s"'), $traversed_key);

                return;
            }

            foreach ($current_data as $index => $item) {
                $this->traverse_and_validate(
                    $item,
                    $key_segments,
                    array_merge($traversed_path_stack, [$index]),
                    $rules
                );
            }
        } elseif (is_array($current_data) && array_key_exists($segment, $current_data)) {
            $this->traverse_and_validate(
                $current_data[$segment],
                $key_segments,
                array_merge($traversed_path_stack, [$segment]),
                $rules
            );
        } else {
            // If the field is missing and there are still segments left,
            // it means an intermediate key is missing. We should stop here.
            // The validation for the intermediate key itself (if any) is handled by its own rule.
            if (!empty($key_segments)) {
                return;
            }

            // Field missing, still run rules to trigger "required" failure
            $traversed_key = implode('.', array_merge($traversed_path_stack, [$segment]));
            $this->apply_rules($rules, $traversed_key, null, true);
        }
    }

    /**
     * Applies a set of rules to a given value.
     *
     * @param array  $rules      An array of validation rules to apply.
     * @param string $traversed_key   The dot-notated key of the value being validated.
     * @param mixed|null  $value      The value being validated.
     * @param bool  $is_field_missing  Whether the field being validated is missing from request.
     *
     * @return void
     */
    protected function apply_rules($rules, $traversed_key, $value = null, $is_field_missing = false)
    {
        $is_valid = true;
        $strict_rule_validations = [];

        foreach ($rules as $rule) {
            if ($rule instanceof Closure) {
                $response = $rule($value, $traversed_key, $this->data);

                if ($response !== true && !is_string($response)) {
                    throw new InvalidValidationRuleException(
                        sprintf(
                            __('The closure must return a boolean true for valid or string as error message, "%s" given', 'kirki-ecommerce'),
                            is_null($response) ? 'null' : (string) $response
                        )
                    );
                }

                if (is_string($response)) {
                    $this->errors[$traversed_key][] = $response;
                    continue;
                }

                $is_valid = $response;
                continue;
            }

            $rule_instance = $this->get_rule_class($rule, $traversed_key, $value, $rules);

            if ($rule_instance->is_check_strict_data_type()) {
                $strict_rule_validations[$rule] = [
                    'is_valid' => $rule_instance->is_valid(),
                    'message' => $rule_instance->get_error_message(),
                    'traversed_key' => $traversed_key
                ];

                continue;
            }

            if (!$rule_instance->is_valid()) {
                $is_valid = false;
                $this->errors[$traversed_key][] = $rule_instance->get_error_message();
            }
        }

        if (!empty($strict_rule_validations)) {
            $is_valid = $this->validate_strict_rules($strict_rule_validations);
        }

        if ($is_valid && !$is_field_missing) {
            $key_segments = explode('.', $traversed_key);
            $this->set_validated_data($key_segments, $value, $is_field_missing);
        }
    }


    /**
     * Validate strict rules.
     * check is there any rule is true then return true otherwise false and set errors
     * 
     * @param array $strict_validations
     * @return bool
     */
    protected function validate_strict_rules(array $strict_validations)
    {
        if (array_search(true, array_column($strict_validations, 'is_valid'), true) !== false) {
            return true;
        }

        foreach ($strict_validations as $item) {
            if (!$item['is_valid'] && $item['message']) {
                $this->errors[$item['traversed_key']][] = $item['message'];
            }
        }

        return false;
    }

    /**
     * Set the validated data using a series of keys to traverse the nested array structure.
     *
     * @param array $keys An array of keys representing the path in the nested array structure.
     * @param mixed $value The value to set at the specified path in the validated data array.
     *
     * @return void
     */
    protected function set_validated_data($keys, $value)
    {
        $ref = &$this->validated_data;
        foreach ($keys as $key) {
            if (!isset($ref[$key])) {
                $ref[$key] = [];
            }
            $ref = &$ref[$key];
        }
        $ref = $value;
    }

    /**
     * Get the rule class instance.
     *
     * @param string|Rule  $rule
     * @param string $key
     * @param mixed  $value
     * @param array  $all_applied_rules
     * 
     * @return Rule
     * @throws InvalidValidationRuleException
     */
    protected function get_rule_class($rule, $key, $value, $all_applied_rules)
    {
        $rule_name_value_array = explode(':', $rule, 2);
        $rule_name = $rule_name_value_array[0];
        $rule_value = isset($rule_name_value_array[1]) ? $rule_name_value_array[1] : null;

        if (is_string($rule) && isset(Validation::RULE_MAP[$rule_name_value_array[0]])) {
            $class_name = Validation::RULE_MAP[$rule_name];
            return new $class_name($key, $value, $rule_value, $this->data, $all_applied_rules);
        }

        if (class_exists($rule_name) && is_subclass_of($rule_name, BaseRule::class)) {
            return new $rule_name($key, $value, $rule_value, $this->data, $all_applied_rules);
        }

        throw new InvalidValidationRuleException(sprintf(__('The validation rule %s does not exist or is invalid', 'kirki-ecommerce'), $rule_name));
    }

    /**
     * Set the error message for a given key in the errors array.
     * The key can be a dot-notated string, e.g. `user.email`.
     *
     * @param string $key   The key to set the error
     * @param string $error_msg The error message
     * @return void
     */
    public function add_error($key, $error_msg)
    {
        $this->errors[$key] = $error_msg;
    }
}
