<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Models\Currency as CurrencyModel;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Static helpers for converting and formatting amounts between stored currencies.
 *
 * @since 1.0.0
 */
class Currency
{
    /**
     * Convert amount from one currency to another.
     *
     * Falls back to the configured base currency (or USD) when no source is given,
     * and returns the amount unchanged when either currency is not stored or both
     * are the same.
     *
     * @since 1.0.0
     *
     * @param float       $amount
     * @param string      $to_currency   Code of the currency to convert to.
     * @param string|null $from_currency Code of the currency to convert from.
     * @return float
     * @throws \Exception When the source currency has an exchange rate of 0.
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

        throw_if($from->exchange_rate === 0, __('Exchange rate 0 is not allowed', 'kirki-ecommerce'));

        return ($amount / $from->exchange_rate) * $to->exchange_rate; //todo: need to check this later with major minor currency implementation
    }

    /**
     * Get the stored exchange rate of a currency.
     *
     * Throws through `throw_if()` when the currency is not found or its rate is 0.
     *
     * @since 1.0.0
     *
     * @param string $to_currency Currency code.
     * @return float
     * @throws \Exception When the currency is not found or its exchange rate is 0.
     */
    public static function exchange_rate(string $to_currency)
    {
        $to = static::resolve_currency($to_currency);

        throw_if(!$to, __('Currency not found', 'kirki-ecommerce'));

        throw_if($to->exchange_rate === 0, __('Exchange rate 0 is not allowed', 'kirki-ecommerce'));

        return $to->exchange_rate;
    }

    /**
     * Look up the stored currency by its code.
     *
     * @since 1.0.0
     *
     * @param string $currency_code
     * @return \Kirki\Ecommerce\App\Models\Currency|null Null when no such currency is stored.
     */
    protected static function resolve_currency(string $currency_code)
    {
        return CurrencyModel::where('code', $currency_code)->first();
    }

    /**
     * Format amount with currency symbol.
     *
     * Formats to 2 decimals, without a symbol when the currency is not stored.
     *
     * @since 1.0.0
     *
     * @param float  $amount
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
