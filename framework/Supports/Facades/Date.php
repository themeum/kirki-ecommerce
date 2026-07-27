<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;

/**
 * @see \Kirki\Ecommerce\Managers\DateManager
 * @see \Kirki\Ecommerce\Contracts\Somoy
 *
 * @method static \Kirki\Ecommerce\Contracts\Somoy now(\DateTimeZone|string|null $timezone = null)
 * @method static \Kirki\Ecommerce\Contracts\Somoy today(\DateTimeZone|string|null $timezone = null)
 * @method static \Kirki\Ecommerce\Contracts\Somoy yesterday(\DateTimeZone|string|null $timezone = null)
 * @method static \Kirki\Ecommerce\Contracts\Somoy tomorrow(\DateTimeZone|string|null $timezone = null)
 * @method static \Kirki\Ecommerce\Contracts\Somoy parse(\DateTimeInterface|string|int|float|null $time = null, \DateTimeZone|string|null $timezone = null)
 * @method static \Kirki\Ecommerce\Contracts\Somoy instance(\DateTimeInterface $date)
 * @method static \Kirki\Ecommerce\Contracts\Somoy create_from_timestamp(int|float|string $timestamp, \DateTimeZone|string|null $timezone = null)
 * @method static \Kirki\Ecommerce\Contracts\Somoy create_from_format(string $format, string $time, \DateTimeZone|string|null $timezone = null)
 * @method static \Kirki\Ecommerce\Contracts\Somoy create(?int $year = null, ?int $month = null, ?int $day = null, ?int $hour = null, ?int $minute = null, ?int $second = null, \DateTimeZone|string|null $timezone = null)
 * @method static bool is_valid_date(mixed $value)
 */
class Date extends Facade
{
    public static function get_accessor()
    {
        return 'date';
    }
}
