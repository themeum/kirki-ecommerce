<?php

namespace Kirki\Ecommerce\App\Mcp\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Validation\Validator;

use function Kirki\Ecommerce\Framework\throw_exception;

/**
 * Validates the arguments of a tool or a prompt with the framework validator.
 *
 * @since 1.0.0
 */
trait ValidatesArguments
{
    /**
     * Validate the arguments with the framework validator.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>  $arguments Tool or prompt arguments.
     * @param array<string, string> $rules     Validation rules.
     * @param array<string, string> $messages  Messages that name the argument.
     *
     * @return array<string, mixed> The validated arguments.
     * @throws ValidationException When an argument is not valid.
     */
    protected function validate_arguments(array $arguments, array $rules, array $messages = [])
    {
        return Validator::make($arguments, $rules, $messages)->validate();
    }

    /**
     * Reject the call with errors keyed by argument.
     *
     * @since 1.0.0
     *
     * @param array<string, string[]> $errors Errors keyed by argument.
     *
     * @return void
     * @throws ValidationException Always.
     */
    protected function reject(array $errors)
    {
        throw_exception(ValidationException::with_errors($errors));
    }

    /**
     * Get the message for an argument that must be one of a list of values.
     *
     * @since 1.0.0
     *
     * @param string   $argument Argument name.
     * @param string[] $values   Allowed values.
     *
     * @return string
     */
    protected function one_of_message(string $argument, array $values)
    {
        /* translators: 1: argument name, 2: comma separated allowed values. */
        return sprintf(__('The "%1$s" must be one of: %2$s.', 'kirki-ecommerce'), $argument, implode(', ', $values));
    }
}
