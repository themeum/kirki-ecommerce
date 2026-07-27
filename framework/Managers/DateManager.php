<?php

namespace Kirki\Ecommerce\Managers;

use BadMethodCallException;
use Kirki\Ecommerce\Somoy;

/**
 * @see \Kirki\Ecommerce\Somoy
 *
 * @method \Kirki\Ecommerce\Somoy now(\DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Somoy today(\DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Somoy yesterday(\DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Somoy tomorrow(\DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Somoy parse(\DateTimeInterface|string|int|float|null $time = null, \DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Somoy instance(\DateTimeInterface $date)
 * @method \Kirki\Ecommerce\Somoy create_from_timestamp(int|float|string $timestamp, \DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Somoy create_from_format(string $format, string $time, \DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Somoy create(?int $year = null, ?int $month = null, ?int $day = null, ?int $hour = null, ?int $minute = null, ?int $second = null, \DateTimeZone|string|null $timezone = null)
 * @method bool is_valid_date(mixed $value)
 */
class DateManager
{
    /**
     * Handle the date functions. Forward the date methods from Date Facade to Somoy.
     *
     * Method names are passed through untouched: the date API is snake_case
     * only and is never translated from another naming style.
     *
     * @param string $method
     * @param array $parameters
     * @return mixed
     * @throws BadMethodCallException
     */
    public function __call($method, $parameters)
    {
        if (!method_exists(Somoy::class, $method)) {
            throw new BadMethodCallException("Call to undefined method Ecommerce\Supports\DateManager::$method");
        }

        return Somoy::$method(...$parameters);
    }
}
