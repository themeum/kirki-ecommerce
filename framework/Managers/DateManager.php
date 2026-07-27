<?php

namespace Kirki\Ecommerce\Managers;

use BadMethodCallException;
use InvalidArgumentException;
use Kirki\Ecommerce\Contracts\Somoy as SomoyContract;
use Kirki\Ecommerce\Somoy;

/**
 * @see \Kirki\Ecommerce\Contracts\Somoy
 *
 * @method \Kirki\Ecommerce\Contracts\Somoy now(\DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Contracts\Somoy today(\DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Contracts\Somoy yesterday(\DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Contracts\Somoy tomorrow(\DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Contracts\Somoy parse(\DateTimeInterface|string|int|float|null $time = null, \DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Contracts\Somoy instance(\DateTimeInterface $date)
 * @method \Kirki\Ecommerce\Contracts\Somoy create_from_timestamp(int|float|string $timestamp, \DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Contracts\Somoy create_from_format(string $format, string $time, \DateTimeZone|string|null $timezone = null)
 * @method \Kirki\Ecommerce\Contracts\Somoy create(?int $year = null, ?int $month = null, ?int $day = null, ?int $hour = null, ?int $minute = null, ?int $second = null, \DateTimeZone|string|null $timezone = null)
 * @method bool is_valid_date(mixed $value)
 */
class DateManager
{
    /**
     * The date class the manager forwards to.
     *
     * @var string
     */
    protected $date_class;

    /**
     * Build the manager on top of a date implementation.
     *
     * Swapping the date library is a matter of binding this manager with a
     * different class name, as long as that class implements the contract.
     *
     * @param string $date_class The date class to forward to.
     * @throws InvalidArgumentException When the class does not implement the date contract.
     */
    public function __construct($date_class = Somoy::class)
    {
        if (!is_a($date_class, SomoyContract::class, true)) {
            throw new InvalidArgumentException(sprintf(
                '%s must implement %s.',
                is_string($date_class) ? $date_class : gettype($date_class),
                SomoyContract::class
            ));
        }

        $this->date_class = $date_class;
    }

    /**
     * Get the date class the manager forwards to.
     *
     * @return string The date class name.
     */
    public function get_date_class()
    {
        return $this->date_class;
    }

    /**
     * Handle the date functions. Forward the date methods from Date Facade to
     * the configured date class.
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
        $date_class = $this->date_class;

        if (!method_exists($date_class, $method)) {
            throw new BadMethodCallException("Call to undefined method Ecommerce\Supports\DateManager::$method");
        }

        return $date_class::$method(...$parameters);
    }
}
