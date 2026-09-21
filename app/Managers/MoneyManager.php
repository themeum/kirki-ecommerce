<?php

namespace Kirki\Ecommerce\App\Managers;

use BadMethodCallException;
use Brick\Math\RoundingMode;
use Brick\Money\Money;
use Kirki\Ecommerce\App\Constants\CookieNames;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\DTO\CurrencyDTO;
use Kirki\Ecommerce\App\DTO\MoneyDTO;
use Kirki\Ecommerce\App\Models\Currency as CurrencyModel;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\Currency;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Supports\Str;
use InvalidArgumentException;
use NumberFormatter;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\App\settings;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Converts, formats and resolves currency amounts on top of Brick\Money.
 *
 * @since 1.0.0
 *
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
     * Name of the header used by API clients to request a display currency.
     *
     * @var string
     */
    public const DISPLAY_CURRENCY_HEADER = 'HTTP_X_KECOM_CURRENCY';

    /**
     * Base currency for the application.
     *
     * @var string
     */
    protected $base_currency;

    /**
     * The resolved display currency code for the current request, or null
     * when nothing valid was requested. False when not yet resolved.
     *
     * @var string|null|false
     */
    protected $display_currency = false;

    /**
     * Currency symbols keyed by currency code (uppercase), cached for the
     * current request.
     *
     * @var array<string, string>|null
     */
    protected static $currency_symbols;

    /**
     * Create the manager and load the store's base currency.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->load_base_currency();
    }

    /**
     * Load the store's base currency code into the manager.
     *
     * @since 1.0.0
     *
     * @return $this
     */
    public function load_base_currency()
    {
        $this->base_currency = base_currency()->code;

        return $this;
    }

    /**
     * Get the store's base currency code.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_base_currency()
    {
        return $this->base_currency;
    }

    /**
     * Resolve the currency code to display amounts in for the current visitor.
     *
     * Uses the currency cookie or the display currency request header, falling
     * back to the base currency when nothing valid was requested.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function resolve_display_currency()
    {
        return $this->resolve_requested_currency() ?? $this->get_base_currency();
    }

    /**
     * Resolve the currency code explicitly requested by the current visitor.
     *
     * Returns null when no currency was requested, the requested currency
     * does not exist or is inactive, or it matches the base currency. The
     * result is cached for the rest of the request.
     *
     * @since 1.0.0
     *
     * @return string|null
     */
    protected function resolve_requested_currency()
    {
        if ($this->display_currency !== false) {
            return $this->display_currency;
        }

        $this->display_currency = null;
        $code = $this->get_requested_currency_code();

        if ($code !== null && $code !== $this->get_base_currency()) {
            $currency = CurrencyModel::where('code', $code)->first();

            if ($currency && $currency->is_active) {
                $this->display_currency = $currency->code;
            }
        }

        return $this->display_currency;
    }

    /**
     * Read the currency code requested via cookie or header, if any.
     *
     * @since 1.0.0
     *
     * @return string|null Uppercased, sanitized code, or null when none was sent.
     */
    protected function get_requested_currency_code()
    {
        $cookie_value = Superglobals::cookie(CookieNames::CURRENCY);
        $header_value = Superglobals::server(static::DISPLAY_CURRENCY_HEADER);
        $code = $cookie_value ?? $header_value;

        if (empty($code) || !is_string($code)) {
            return null;
        }

        $code = strtoupper(function_exists('sanitize_text_field') ? sanitize_text_field($code) : trim($code));

        return $code !== '' ? $code : null;
    }

    /**
     * Convert the given amount to minor units in the given currency.
     *
     * @since 1.0.0
     *
     * @param mixed                     $amount   Amount in major units.
     * @param mixed                     $currency Currency code or object; defaults to the base currency.
     * @param int                       $rounding Brick RoundingMode constant.
     * @param \Brick\Money\Context|null $context  Brick money context.
     * @return int Amount in minor units.
     */
    public static function to_minor($amount, $currency = null, $rounding = RoundingMode::HALF_UP, $context = null)
    {
        $instance = new static();

        if (empty($currency)) {
            $currency = $instance->get_base_currency();
        }

        return $instance->of($amount, $currency, $context, $rounding)->getMinorAmount()->toInt();
    }

    /**
     * Build a Money object from an amount given in minor units.
     *
     * @since 1.0.0
     *
     * @param mixed                     $amount   Amount in minor units.
     * @param mixed                     $currency Currency code or object; defaults to the base currency.
     * @param int                       $rounding Brick RoundingMode constant.
     * @param \Brick\Money\Context|null $context  Brick money context.
     * @return Money
     */
    public static function from_minor($amount, $currency = null, $rounding = RoundingMode::HALF_UP, $context = null)
    {
        $instance = new static();

        if (empty($currency)) {
            $currency = $instance->get_base_currency();
        }

        return $instance->of_minor($amount, $currency, $context, $rounding);
    }

    /**
     * Format a Money object using the store's separator, position and symbol settings.
     *
     * @since 1.0.0
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

        if ($currency_settings['thousand_separator'] === 'space') {
            $currency_settings['thousand_separator'] = ' ';
        }

        if ($currency_settings['decimal_separator'] === 'space') {
            $currency_settings['decimal_separator'] = ' ';
        }

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
     * Format an amount given in minor units.
     *
     * @since 1.0.0
     *
     * @param mixed                     $amount   Amount in minor units.
     * @param mixed                     $currency Currency code or object; defaults to the base currency.
     * @param int                       $rounding Brick RoundingMode constant.
     * @param \Brick\Money\Context|null $context  Brick money context.
     * @return string
     */
    public function format_from_minor($amount, $currency = null, $rounding = RoundingMode::HALF_UP, $context = null)
    {
        $instance = new static();

        if (empty($currency)) {
            $currency = $instance->get_base_currency();
        }

        $money = static::from_minor($amount, $currency, $rounding, $context);
        return $this->format($money);
    }

    /**
     * Format an amount given in major (decimal) units.
     *
     * @since 1.0.0
     *
     * @param mixed                     $amount   Amount in major units.
     * @param mixed                     $currency Currency code or object; defaults to the base currency.
     * @param int                       $rounding Brick RoundingMode constant.
     * @param \Brick\Money\Context|null $context  Brick money context.
     * @return string
     */
    public function format_from_decimal($amount, $currency = null, $rounding = RoundingMode::HALF_UP, $context = null)
    {
        $instance = new static();

        if (empty($currency)) {
            $currency = $instance->get_base_currency();
        }

        $money = static::of($amount, $currency, $context, $rounding);
        return $this->format($money);
    }

    /**
     * Get the display symbol for a currency code.
     *
     * Prefers the symbol stored against the currency in the database, since
     * it reflects the actual symbol for that currency (e.g. BDT's ৳) rather
     * than ICU's `en_US` locale data, which only has symbols for currencies
     * commonly used/displayed in the US and otherwise falls back to the
     * plain currency code.
     *
     * @since 1.0.0
     *
     * @param string $code Currency code.
     * @return string
     */
    public static function get_currency_symbol($code)
    {
        $code = strtoupper($code);

        if (static::$currency_symbols === null) {
            static::$currency_symbols = app(CurrencyService::class)->get_symbol_map();
        }

        if (!empty(static::$currency_symbols[$code])) {
            return static::$currency_symbols[$code];
        }

        return (new NumberFormatter('en_US@currency=' . $code, NumberFormatter::CURRENCY))
            ->getSymbol(NumberFormatter::CURRENCY_SYMBOL);
    }

    /**
     * Convert a Money amount to another currency.
     *
     * @since 1.0.0
     *
     * @param Money      $money
     * @param string     $currency      Target currency code.
     * @param float|null $exchange_rate Rate to apply; defaults to the stored rate for the target currency.
     * @return Money
     */
    public function convert_to_currency(Money $money, string $currency, $exchange_rate = null)
    {
        return $money->convertedTo($currency, $exchange_rate ?? Currency::exchange_rate($currency), null, RoundingMode::HALF_UP);
    }

    /**
     * Create a zero Money amount.
     *
     * @since 1.0.0
     *
     * @param string|null $currency Currency code; defaults to the base currency.
     * @return Money
     */
    public function zero($currency = null)
    {
        return Money::zero($currency ?? $this->get_base_currency());
    }

    /**
     * Build a Money object from a minor amount, optionally converted to a target currency.
     *
     * @since 1.0.0
     *
     * @param int|float   $amount          Amount in minor units.
     * @param string|null $currency_code   Currency the amount is in; defaults to the base currency.
     * @param string|null $target_currency Currency to convert to, if any.
     * @return Money
     */
    public function prepare_money_from_minor($amount, $currency_code = null, $target_currency = null)
    {
        $currency_code = $currency_code ?? $this->get_base_currency();

        if ($target_currency !== null) {
            return $this->convert_to_currency($this->from_minor($amount, $currency_code), $target_currency);
        }

        return $this->from_minor($amount, $currency_code);
    }

    /**
     * Get a minor amount as a float in major units, optionally converted to a target currency.
     *
     * @since 1.0.0
     *
     * @param int|float   $amount          Amount in minor units.
     * @param string|null $currency_code   Currency the amount is in; defaults to the base currency.
     * @param string|null $target_currency Currency to convert to, if any.
     * @return float
     */
    public function prepare_amount_from_minor($amount, $currency_code = null, $target_currency = null)
    {
        return $this->prepare_money_from_minor($amount, $currency_code, $target_currency)->getAmount()->toFloat();
    }

    /**
     * Build a MoneyDTO from a minor amount, optionally converted to a target currency.
     *
     * @since 1.0.0
     *
     * @param int|float   $amount          Amount in minor units.
     * @param string|null $currency_code   Currency the amount is in; defaults to the base currency.
     * @param string|null $target_currency Currency to convert to, if any.
     * @return MoneyDTO
     */
    public function prepare_amount_object_from_minor($amount, $currency_code = null, $target_currency = null)
    {
        return $this->to_dto($this->prepare_money_from_minor($amount, $currency_code, $target_currency)->getMinorAmount()->toInt(), $target_currency ?? $currency_code);
    }

    /**
     * Build a MoneyDTO with the raw amount, formatted display string and currency from a minor amount.
     *
     * @since 1.0.0
     *
     * @param int         $minor_amount Amount in minor units.
     * @param string|null $currency     Currency the amount is in; defaults to the base currency.
     * @return MoneyDTO
     */
    public function to_dto($minor_amount, $currency = null)
    {
        $currency = $currency ?? $this->base_currency;
        $money = $this->from_minor($minor_amount, $currency);

        return MoneyDTO::from_array([
            'raw' => $money->getAmount()->toFloat(),
            'display' => $this->format($money),
            'currency' => CurrencyDTO::from_array([
                'code' => $currency,
                'symbol' => static::get_currency_symbol($currency),
            ]),
        ]);
    }


    /**
     * Forward a call to the Money method of the same name.
     *
     * The method name is camel-cased, and the base currency is used when the
     * currency argument is empty.
     *
     * @since 1.0.0
     *
     * @param string $method     Method name to call on Money.
     * @param array  $parameters Arguments passed to the Money method.
     * @return Money
     * @throws BadMethodCallException When Money has no such method.
     * @throws InvalidArgumentException When no arguments are given.
     */
    public function __call($method, $parameters)
    {
        $method = Str::camel($method);

        throw_if(!method_exists(Money::class, $method), "Method {$method} does not exist on " . Money::class, BadMethodCallException::class);

        throw_if(empty($parameters), "Money {$method} method requires at least one parameter.", InvalidArgumentException::class);

        if (empty($parameters[1])) {
            $parameters[1] = $this->get_base_currency();
        }

        return Money::$method(...$parameters);
    }
}
