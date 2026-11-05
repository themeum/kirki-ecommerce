<?php

namespace Kirki\Ecommerce\App\Mcp\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;
use Kirki\Ecommerce\App\Services\AnalyticsRangeResolver;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

use function Kirki\Ecommerce\App\client_timezone;

/**
 * Reads the date range of an analytics tool with the rules of the Analytics page.
 *
 * The using class has a $range_resolver property and the validate_arguments() and reject() methods of StoreReadTool.
 *
 * @since 1.0.0
 */
trait ReadsAnalyticsRange
{
    /**
     * Get the schema of the range arguments.
     *
     * @since 1.0.0
     *
     * @param JsonSchema $schema The schema builder.
     *
     * @return array<string, mixed>
     */
    protected function range_schema(JsonSchema $schema)
    {
        $date_pattern = '^\d{4}-\d{2}-\d{2}$';

        return [
            'range' => $schema->string()
                ->enum(AnalyticsRangeResolver::PRESETS)
                ->default(AnalyticsRangeResolver::DEFAULT_PRESET)
                ->description('The date range. Use "custom" with "from" and "to" for any other period.'),
            'from' => $schema->string()
                ->pattern($date_pattern)
                ->description('First day of a custom range, Y-m-d. Required when range is "custom".'),
            'to' => $schema->string()
                ->pattern($date_pattern)
                ->description('Last day of a custom range, Y-m-d, not after today. Required when range is "custom".'),
            'compare' => $schema->string()
                ->enum(AnalyticsRangeResolver::COMPARISONS)
                ->description('Optional. The earlier period to compare with. Leave it out unless the user asks for a comparison.'),
            'compare_from' => $schema->string()
                ->pattern($date_pattern)
                ->description('First day of a custom comparison, Y-m-d. Required when compare is "custom".'),
            'compare_to' => $schema->string()
                ->pattern($date_pattern)
                ->description('Last day of a custom comparison, Y-m-d. Required when compare is "custom".'),
        ];
    }

    /**
     * Validate the range arguments and other arguments, then the order of the dates.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>  $arguments Tool arguments.
     * @param array<string, string> $rules     Rules of the other arguments.
     * @param array<string, string> $messages  Messages of the other arguments.
     *
     * @return array<string, mixed> The validated arguments, with "compare" set to "none" when it is left out.
     * @throws ValidationException When an argument is not valid.
     */
    protected function validate_range(array $arguments, array $rules = [], array $messages = [])
    {
        $params = $this->validate_arguments($arguments, array_merge($this->range_rules(), $rules), array_merge($this->range_messages(), $messages));

        $errors = [];

        if (($params['range'] ?? null) === 'custom') {
            if ($params['to'] > $this->range_resolver->today()) {
                $errors['to'] = [__('The end date "to" cannot be after today.', 'kirki-ecommerce')];
            } elseif ($params['from'] > $params['to']) {
                $errors['from'] = [__('The start date "from" cannot be after the end date "to".', 'kirki-ecommerce')];
            }
        }

        if (($params['compare'] ?? null) === 'custom' && $params['compare_from'] > $params['compare_to']) {
            $errors['compare_from'] = [__('The comparison start date "compare_from" cannot be after "compare_to".', 'kirki-ecommerce')];
        }

        if (!empty($errors)) {
            $this->reject($errors);
        }

        $params['compare'] = $params['compare'] ?? 'none';

        return $params;
    }

    /**
     * Get the validation rules of the range arguments, the same as the Analytics page.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function range_rules()
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
     * Get the validation messages of the range arguments. Each one names its argument, so the client knows what to fix.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function range_messages()
    {
        $field_messages = [
            'from' => __('Enter a start date "from" as Y-m-d.', 'kirki-ecommerce'),
            'to' => __('Enter an end date "to" as Y-m-d.', 'kirki-ecommerce'),
            'compare_from' => __('Enter a comparison start date "compare_from" as Y-m-d.', 'kirki-ecommerce'),
            'compare_to' => __('Enter a comparison end date "compare_to" as Y-m-d.', 'kirki-ecommerce'),
        ];

        $messages = [
            'range.in' => __('The range must be one of: ', 'kirki-ecommerce') . implode(', ', AnalyticsRangeResolver::PRESETS) . '.',
            'compare.in' => __('The compare must be one of: ', 'kirki-ecommerce') . implode(', ', AnalyticsRangeResolver::COMPARISONS) . '.',
        ];

        foreach ($field_messages as $field => $message) {
            $messages[$field . '.required_if'] = $message;
            $messages[$field . '.date'] = $message;
            $messages[$field . '.format'] = $message;
        }

        return $messages;
    }

    /**
     * Get the range fields that every analytics tool result has.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta Meta of an Analytics page metric.
     *
     * @return array<string, mixed>
     */
    protected function range_result(array $meta)
    {
        return [
            'range' => $meta['range'],
            'compare' => $meta['compare'],
            'time_zone' => client_timezone()->getName(),
            'currency' => $meta['base_currency_code'],
            'has_orders' => $meta['has_orders'],
        ];
    }

    /**
     * Turn a money metric of the Analytics page into a total with its previous value and change.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $metric Money metric with current_money_object, previous_money_object and change.
     *
     * @return array<string, mixed>
     */
    protected function money_total(array $metric)
    {
        return [
            'current' => $this->money_value($metric['current_money_object']),
            'previous' => $this->money_value($metric['previous_money_object']),
            'change' => $metric['change'],
        ];
    }

    /**
     * Get the schema of the limit argument of a ranked metric.
     *
     * @since 1.0.0
     *
     * @param JsonSchema $schema      The schema builder.
     * @param string     $description What the limit counts and its default.
     *
     * @return \Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\Types\Type
     */
    protected function limit_schema(JsonSchema $schema, string $description)
    {
        return $schema->integer()
            ->min(1)
            ->max(AnalyticsQueryService::MAX_LIMIT)
            ->description($description);
    }

    /**
     * Get the validation rule and messages of the limit argument.
     *
     * @since 1.0.0
     *
     * @return array{0: array<string, string>, 1: array<string, string>} The rules and the messages.
     */
    protected function limit_validation()
    {
        /* translators: %d: highest limit. */
        $message = sprintf(__('The "limit" must be an integer from 1 to %d.', 'kirki-ecommerce'), AnalyticsQueryService::MAX_LIMIT);

        return [
            ['limit' => 'nullable|integer|min:1|max:' . AnalyticsQueryService::MAX_LIMIT],
            ['limit.integer' => $message, 'limit.min' => $message, 'limit.max' => $message],
        ];
    }

    /**
     * Turn the rows of an Analytics page card into plain rows.
     *
     * Each money object becomes { amount, display, currency } under the key without "_money_object".
     * Images and other objects are left out.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $rows Card rows.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function plain_rows(array $rows)
    {
        return array_map(function ($row) {
            $plain = [];

            foreach ($row as $key => $value) {
                if (substr($key, -13) === '_money_object') {
                    $plain[substr($key, 0, -13)] = $this->money_value($value);
                } elseif (!is_object($value) && !in_array($key, ['image', 'numeric_code'], true)) {
                    $plain[$key] = $value;
                }
            }

            return $plain;
        }, $rows);
    }
}
