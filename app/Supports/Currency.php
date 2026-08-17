<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Models\Currency as CurrencyModel;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Exception;

class Currency
{
    /**
     * Convert amount from one currency to another.
     *
     * @param float $amount
     * @param string $to_currency
     * @param string|null $from_currency
     * @return float
     */
    public static function convert(float $amount, string $to_currency, $from_currency = null)
    {
        $from_currency = $from_currency ?? Option::get(OptionKeys::CURRENCY_SETTINGS)["base_currency"] ?? "USD";

        $to = static::resolve_currency($to_currency);
        $from = static::resolve_currency($from_currency);

        if (!$from || !$to) {
            return $amount;
        }

        if ($from->code === $to->code) {
            return $amount;
        }

        if ($from->exchange_rate === 0) {
            throw new Exception(__('Exchange rate 0 is not allowed', 'kirki-ecommerce'));
        }

        return ($amount / $from->exchange_rate) * $to->exchange_rate; //todo: need to check this later with major minor currency implementation
    }

    /**
     * Get exchange rate for a currency from base currency.
     *
     * @param string $to_currency
     * @return float
     */
    public static function exchange_rate(string $to_currency)
    {
        $to = static::resolve_currency($to_currency);

        if (!$to) {
            throw new Exception(__('Currency not found', 'kirki-ecommerce'));
        }

        if ($to->exchange_rate === 0) {
            throw new Exception(__('Exchange rate 0 is not allowed', 'kirki-ecommerce'));
        }

        return $to->exchange_rate;
    }

    /**
     * Resolve currency from code or object.
     *
     * @param string $currency_code
     * @return \Kirki\Ecommerce\App\Models\Currency|null
     */
    protected static function resolve_currency(string $currency_code)
    {
        return CurrencyModel::where('code', $currency_code)->first();
    }

    /**
     * Format amount with currency symbol.
     *
     * @param float $amount
     * @param string $currency_code
     * @return string
     */
    public static function format(float $amount, string $currency_code)
    {
        $currency_obj = static::resolve_currency($currency_code);

        if (!$currency_obj) {
            return number_format($amount, 2);
        }

        return $currency_obj->symbol . number_format($amount, 2);
    }
}
