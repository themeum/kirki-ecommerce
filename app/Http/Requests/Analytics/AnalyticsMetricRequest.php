<?php

namespace Kirki\Ecommerce\App\Http\Requests\Analytics;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Services\AnalyticsRangeResolver;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\throw_exception;

/**
 * Validates and sanitizes the range and comparison of an analytics metric request.
 *
 * @since 1.0.0
 */
class AnalyticsMetricRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'range' => 'nullable|string|in:' . implode(',', AnalyticsRangeResolver::PRESETS),
            'from' => 'required_if:range,custom|nullable|date|format:Y-m-d',
            'to' => 'required_if:range,custom|nullable|date|format:Y-m-d',
            'compare' => 'nullable|string|in:' . implode(',', AnalyticsRangeResolver::COMPARISONS),
            'compare_from' => 'required_if:compare,custom|nullable|date|format:Y-m-d',
            'compare_to' => 'required_if:compare,custom|nullable|date|format:Y-m-d',
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function messages()
    {
        $field_messages = [
            'from' => __('Enter a start date.', 'kirki-ecommerce'),
            'to' => __('Enter an end date.', 'kirki-ecommerce'),
            'compare_from' => __('Enter a comparison start date.', 'kirki-ecommerce'),
            'compare_to' => __('Enter a comparison end date.', 'kirki-ecommerce'),
        ];

        $messages = [];

        foreach ($field_messages as $field => $message) {
            $messages[$field . '.required_if'] = $message;
            $messages[$field . '.date'] = $message;
            $messages[$field . '.format'] = $message;
        }

        return $messages;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function filters()
    {
        return [
            'range' => Sanitizer::TEXT,
            'from' => Sanitizer::TEXT,
            'to' => Sanitizer::TEXT,
            'compare' => Sanitizer::TEXT,
            'compare_from' => Sanitizer::TEXT,
            'compare_to' => Sanitizer::TEXT,
        ];
    }

    /**
     * Check the order of the dates of a custom range and a custom comparison.
     *
     * @since 1.0.0
     *
     * @return void
     * @throws ValidationException When a date is in the future or out of order.
     */
    protected function passed_validation()
    {
        $errors = [];

        if ($this->input('range') === 'custom') {
            $errors = $this->validate_custom_range($errors);
        }

        if ($this->input('compare') === 'custom') {
            $errors = $this->validate_custom_comparison($errors);
        }

        if (!empty($errors)) {
            throw_exception(ValidationException::with_errors($errors));
        }
    }

    /**
     * Check that a custom range does not end after today and does not start after its end.
     *
     * @since 1.0.0
     *
     * @param array<string, string[]> $errors Errors found so far.
     *
     * @return array<string, string[]>
     */
    protected function validate_custom_range(array $errors)
    {
        $from = (string) $this->input('from');
        $to = (string) $this->input('to');

        if ($to > app()->make(AnalyticsRangeResolver::class)->today()) {
            $errors['to'] = [__('The end date cannot be after today.', 'kirki-ecommerce')];
        } elseif ($from > $to) {
            $errors['from'] = [__('The start date cannot be after the end date.', 'kirki-ecommerce')];
        }

        return $errors;
    }

    /**
     * Check that a custom comparison range does not start after its end.
     *
     * @since 1.0.0
     *
     * @param array<string, string[]> $errors Errors found so far.
     *
     * @return array<string, string[]>
     */
    protected function validate_custom_comparison(array $errors)
    {
        $from = (string) $this->input('compare_from');
        $to = (string) $this->input('compare_to');

        if ($from > $to) {
            $errors['compare_from'] = [__('The comparison start date cannot be after the end date.', 'kirki-ecommerce')];
        }

        return $errors;
    }
}
