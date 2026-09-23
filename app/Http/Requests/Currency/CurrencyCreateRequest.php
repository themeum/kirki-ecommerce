<?php

namespace Kirki\Ecommerce\App\Http\Requests\Currency;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for creating one or more currencies.
 *
 * @since 1.0.0
 */
class CurrencyCreateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'items' => 'required|array',
            'items.*.code' => 'required|string|unique:' . Currency::get_table_name() . ',code',
            'items.*.name' => 'required|string',
            'items.*.symbol' => 'required|string',
            'items.*.exchange_rate' => 'required|float',
            'items.*.is_base' => ['nullable', 'boolean', $this->at_most_one_base_currency()],
            'items.*.is_active' => 'nullable|boolean',
        ];
    }

    /**
     * Build a closure rule that rejects a request flagging more than one currency as base.
     *
     * @since 1.0.0
     *
     * @return \Closure Rule callback returning true when at most one item is a base currency, or an error message.
     */
    protected function at_most_one_base_currency()
    {
        return function ($is_base, $key, $data) {
            $items = is_array($data['items'] ?? null) ? $data['items'] : [];

            $base_items = array_filter($items, function ($item) {
                return is_array($item) && Sanitizer::apply_rule($item['is_base'] ?? false, Sanitizer::BOOL);
            });

            if (count($base_items) <= 1) {
                return true;
            }

            return __('Only one currency can be the base currency.', 'kirki-ecommerce');
        };
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function filters()
    {
        return [
            'items.*.code' => Sanitizer::TEXT,
            'items.*.name' => Sanitizer::TEXT,
            'items.*.symbol' => Sanitizer::TEXT,
            'items.*.exchange_rate' => Sanitizer::FLOAT,
            'items.*.is_base' => Sanitizer::BOOL,
            'items.*.is_active' => Sanitizer::BOOL,
        ];
    }
}
