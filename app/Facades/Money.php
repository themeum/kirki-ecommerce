<?php

namespace Kirki\Ecommerce\App\Facades;

use Kirki\Ecommerce\Framework\Facade;


/**
 * @method static \Brick\Money\Money min(\Brick\Money\Money $money, \Brick\Money\Money ...$monies)
 * @method static \Brick\Money\Money max(\Brick\Money\Money $money, \Brick\Money\Money ...$monies)
 * @method static \Brick\Money\Money total(\Brick\Money\Money $money, \Brick\Money\Money ...$monies)
 * @method static \Brick\Money\Money create(\Brick\Math\BigNumber $amount, \Brick\Money\Currency $currency, \Brick\Money\Context $context, int $roundingMode = \Brick\Math\RoundingMode::UNNECESSARY)
 * @method static \Brick\Money\Money of(mixed $amount, mixed $currency = null, ?\Brick\Money\Context $context = null, int $roundingMode = \Brick\Math\RoundingMode::UNNECESSARY)
 * @method static \Brick\Money\Money of_minor(mixed $minorAmount, mixed $currency = null, ?\Brick\Money\Context $context = null, int $roundingMode = \Brick\Math\RoundingMode::UNNECESSARY)
 * @method static \Brick\Money\Money zero(mixed $currency = null, ?\Brick\Money\Context $context = null)
 * @method static int to_minor(mixed $amount, mixed $currency = null, int $roundingMode = \Brick\Math\RoundingMode::HALF_UP, \Brick\Money\Context $context = null)
 * @method static \Brick\Money\Money from_minor(mixed $minorAmount, mixed $currency = null, int $roundingMode = \Brick\Math\RoundingMode::HALF_UP, \Brick\Money\Context $context = null)
 * @method static \Kirki\Ecommerce\App\DTO\MoneyDTO to_dto(mixed $minorAmount, mixed $currency = null)
 * @method static string format(\Brick\Money\Money $money)
 * @method static string format_from_minor(mixed $minorAmount, mixed $currency = null, int $roundingMode = \Brick\Math\RoundingMode::HALF_UP, \Brick\Money\Context $context = null)
 * @method static string format_from_decimal(mixed $amount, mixed $currency = null, int $roundingMode = \Brick\Math\RoundingMode::HALF_UP, \Brick\Money\Context $context = null)
 * @method static \Brick\Money\Money convert_to_currency(\Brick\Money\Money $money, string $currency, $exchange_rate = null)
 * @method static float prepare_amount(mixed $amount, $currency = null, $target_currency = null)
 * @method static \Kirki\Ecommerce\App\DTO\MoneyDTO prepare_amount_object(mixed $amount, $currency = null, $target_currency = null)
 * @method static \Brick\Money\Money prepare_amount_money(mixed $amount, string $currency = null)
 * 
 * @see \Kirki\Ecommerce\App\Managers\MoneyManager
 */
class Money extends Facade
{
    public static function get_accessor()
    {
        return 'money';
    }
}
