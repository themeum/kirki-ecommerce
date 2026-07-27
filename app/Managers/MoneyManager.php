<?php

namespace Kirki\Ecommerce\App\Managers;

use BadMethodCallException;
use Brick\Math\RoundingMode;
use Brick\Money\Money;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Supports\Currency;
use Kirki\Ecommerce\Supports\Str;
use InvalidArgumentException;
use NumberFormatter;

use function Kirki\Ecommerce\base_currency;
use function Kirki\Ecommerce\settings;

/**
 * @method static \Brick\Money\Money min(\Brick\Money\Money $money, \Brick\Money\Money ...$monies)
 * @method static \Brick\Money\Money max(\Brick\Money\Money $money, \Brick\Money\Money ...$monies)
 * @method static \Brick\Money\Money total(\Brick\Money\Money $money, \Brick\Money\Money ...$monies)
 * @method static \Brick\Money\Money create(\Brick\Math\BigNumber $amount, \Brick\Money\Currency $currency, \Brick\Money\Context $context, int $roundingMode = \Brick\Math\RoundingMode::UNNECESSARY)
 * @method static \Brick\Money\Money of(mixed $amount, mixed $currency = null, ?\Brick\Money\Context $context = null, int $roundingMode = \Brick\Math\RoundingMode::UNNECESSARY)
 * @method static \Brick\Money\Money of_minor(mixed $minorAmount, mixed $currency = null, ?\Brick\Money\Context $context = null, int $roundingMode = \Brick\Math\RoundingMode::UNNECESSARY)
 * @method static \Brick\Money\Money zero(mixed $currency = null, ?\Brick\Money\Context $context = null)
 * 
 * @see \Brick\Money\Money
 */
class MoneyManager
{
    /**
     * Base currency for the application.
     *
     * @var string
     */
    protected $base_currency;

    public function __construct()
    {
        $this->load_base_currency();
    }

    /**
     * Load the base currency.
     *
     * @return static
     */
    public function load_base_currency()
    {
        $this->base_currency = base_currency()->code;

        return $this;
    }

    /**
     * Get the base currency.
     *
     * @return string
     */
    public function get_base_currency()
    {
        return $this->base_currency;
    }

    /**
     * Convert the given amount to minor units.
     *
     * @param mixed $amount
     * @param mixed $currency
     * @return int
     */
    public static function to_minor($amount, $currency = null, $rounding = RoundingMode::HALF_UP, $context = null)
    {
        $instance = new static;

        if (empty($currency)) {
            $currency = $instance->get_base_currency();
        }

        return $instance->of($amount, $currency, $context, $rounding)->getMinorAmount()->toInt();
    }

    /**
     * Convert the given minor amount to major units.
     *
     * @param mixed $amount
     * @param mixed $currency
     * @return Money
     */
    public static function from_minor($amount, $currency = null, $rounding = RoundingMode::HALF_UP, $context = null)
    {
        $instance = new static;

        if (empty($currency)) {
            $currency = $instance->get_base_currency();
        }

        return $instance->of_minor($amount, $currency, $context, $rounding);
    }

    /**
     * Format the given amount.
     *
     * @param Money $money
     * @return string
     */
    public function format(Money $money)
    {
        $amount = (string) $money->getAmount();
        $currency_code = $money->getCurrency()->getCurrencyCode();
        $currency = settings(OptionKeys::CURRENCY_SETTINGS);

        $currency_settings = [
            'decimal_separator' => $currency->get('decimal_separator', '.'),
            'thousand_separator' => $currency->get('thousand_separator', ','),
            'currency_position' => $currency->get('currency_position', 'before'),
        ];

        $decimals = $money->getCurrency()->getDefaultFractionDigits();

        $formatted_amount = number_format(
            (float) $amount,
            $decimals,
            $currency_settings['decimal_separator'],
            $currency_settings['thousand_separator']
        );
        $currency_symbol = static::get_currency_symbol($currency_code);

        return $currency_settings['currency_position'] === 'before'
            ? sprintf('%s%s', $currency_symbol, $formatted_amount)
            : sprintf('%s%s', $formatted_amount, $currency_symbol);
    }

    /**
     * Format the given amount from storage.
     *
     * @param mixed $amount
     * @param mixed $currency
     * @param int $rounding
     * @param \Brick\Money\Context $context
     * @return string
     */
    public function format_from_minor($amount, $currency = null, $rounding = RoundingMode::HALF_UP, $context = null)
    {
        $instance = new static;

        if (empty($currency)) {
            $currency = $instance->get_base_currency();
        }

        $money = static::from_minor($amount, $currency, $rounding, $context);
        return $this->format($money);
    }

    /**
     * Format the given amount from decimal.
     *
     * @param mixed $amount
     * @param mixed $currency
     * @param int $rounding
     * @param \Brick\Money\Context $context
     * @return string
     */
    public function format_from_decimal($amount, $currency = null, $rounding = RoundingMode::HALF_UP, $context = null)
    {
        $instance = new static;

        if (empty($currency)) {
            $currency = $instance->get_base_currency();
        }

        $money = static::of($amount, $currency, $context, $rounding);
        return $this->format($money);
    }

    /**
     * Get the currency symbol.
     *
     * @param string $code
     * @return string
     */
    public static function get_currency_symbol($code)
    {
        return (new NumberFormatter('en_US@currency=' . $code, NumberFormatter::CURRENCY))
            ->getSymbol(NumberFormatter::CURRENCY_SYMBOL);
    }

    /**
     * Convert the given amount from base currency to the target currency.
     *
     * @param Money $money
     * @param string $currency
     * @param float $exchange_rate
     * @return Money
     */
    public function convert_to_currency(Money $money, string $currency, $exchange_rate = null)
    {
        return $money->convertedTo($currency, $exchange_rate ?? Currency::exchange_rate($currency));
    }

    /**
     * Create a zero amount.
     *
     * @param string $currency
     * @return Money
     */
    public function zero($currency = null)
    {
        return Money::zero($currency ?? $this->get_base_currency());
    }


    /**
     * Handle dynamic method calls to the Money class.
     *
     * @param string $method
     * @param array $parameters
     * @return Money
     * @throws BadMethodCallException
     */
    public function __call($method, $parameters)
    {
        $method = Str::camel($method);

        if (!method_exists(Money::class, $method)) {
            throw new BadMethodCallException("Method {$method} does not exist on " . Money::class);
        }

        if (empty($parameters)) {
            throw new InvalidArgumentException("Money {$method} method requires at least one parameter.");
        }

        if (empty($parameters[1])) {
            $parameters[1] = $this->get_base_currency();
        }

        return Money::$method(...$parameters);
    }
}
