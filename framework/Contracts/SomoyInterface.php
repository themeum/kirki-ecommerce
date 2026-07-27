<?php

namespace Kirki\Ecommerce\Contracts;

use DateTimeInterface;
use JsonSerializable;

/**
 * Contract for a date and time value object.
 *
 * Type against this instead of a concrete date class so the implementation can
 * be replaced without touching the call sites.
 *
 * Extending DateTimeInterface is deliberate. The query layer branches on
 * `instanceof DateTimeInterface` when it prepares bindings and builds date
 * comparisons, and PHP refuses to let a plain user class implement
 * DateTimeInterface. An implementation of this contract must therefore extend
 * the native DateTime (or DateTimeImmutable), which is exactly the guarantee
 * those call sites need. That also supplies format(), diff(), getTimestamp(),
 * getTimezone() and getOffset(), so they are not redeclared here.
 *
 * Naming rules for implementations:
 *
 * - Every method declared here is snake_case. The camelCase methods inherited
 *   from the native date classes stay reachable because PHP cannot hide them,
 *   but the snake_case counterparts are the supported API.
 * - Mutating methods are expected to change the instance in place and return
 *   `$this`, so they can be chained. Callers use copy() to keep the original.
 *
 * Format constants are intentionally left off this contract: PHP 7.4 forbids a
 * class from overriding a constant it inherits from an interface, and the
 * formatters read theirs through `static::`, which implementations are meant to
 * be able to override.
 *
 * @since 1.0.0
 */
interface SomoyInterface extends DateTimeInterface, JsonSerializable
{
    /**
     * Get an instance for the current date and time.
     *
     * @param \DateTimeZone|string|null $timezone The timezone to use.
     * @return static The current date and time.
     * @since 1.0.0
     */
    public static function now($timezone = null);

    /**
     * Get an instance for today at midnight.
     *
     * @param \DateTimeZone|string|null $timezone The timezone to use.
     * @return static Today at midnight.
     * @since 1.0.0
     */
    public static function today($timezone = null);

    /**
     * Get an instance for yesterday at midnight.
     *
     * @param \DateTimeZone|string|null $timezone The timezone to use.
     * @return static Yesterday at midnight.
     * @since 1.0.0
     */
    public static function yesterday($timezone = null);

    /**
     * Get an instance for tomorrow at midnight.
     *
     * @param \DateTimeZone|string|null $timezone The timezone to use.
     * @return static Tomorrow at midnight.
     * @since 1.0.0
     */
    public static function tomorrow($timezone = null);

    /**
     * Parse a value into a date instance.
     *
     * Integers and floats are read as unix timestamps. Null and empty strings
     * resolve to the current date and time.
     *
     * @param DateTimeInterface|string|int|float|null $time The value to parse.
     * @param \DateTimeZone|string|null $timezone The timezone to use.
     * @return static The parsed date.
     * @throws \Kirki\Ecommerce\Exceptions\InvalidDateFormatException When the value cannot be parsed.
     * @since 1.0.0
     */
    public static function parse($time = null, $timezone = null);

    /**
     * Create an instance from any other date object, preserving the
     * microseconds and the timezone.
     *
     * @param DateTimeInterface $date The date to copy.
     * @return static The new instance.
     * @since 1.0.0
     */
    public static function instance(DateTimeInterface $date);

    /**
     * Create an instance from a unix timestamp.
     *
     * A timestamp without an explicit timezone is expressed in the default
     * timezone rather than in UTC.
     *
     * @param int|float|string $timestamp The unix timestamp.
     * @param \DateTimeZone|string|null $timezone The timezone to use.
     * @return static The new instance.
     * @throws \Kirki\Ecommerce\Exceptions\InvalidDateFormatException When the timestamp is not numeric.
     * @since 1.0.0
     */
    public static function create_from_timestamp($timestamp, $timezone = null);

    /**
     * Create an instance from a value matching the given format.
     *
     * @param string $format The format the value is written in.
     * @param string $time The value to read.
     * @param \DateTimeZone|string|null $timezone The timezone to use.
     * @return static The new instance.
     * @throws \Kirki\Ecommerce\Exceptions\InvalidDateFormatException When the value does not match the format.
     * @since 1.0.0
     */
    public static function create_from_format($format, $time, $timezone = null);

    /**
     * Create an instance from the given date and time parts.
     *
     * Any part left as null falls back to the matching part of the current
     * date and time.
     *
     * @param int|null $year The year.
     * @param int|null $month The month.
     * @param int|null $day The day.
     * @param int|null $hour The hour.
     * @param int|null $minute The minute.
     * @param int|null $second The second.
     * @param \DateTimeZone|string|null $timezone The timezone to use.
     * @return static The new instance.
     * @since 1.0.0
     */
    public static function create(
        $year = null,
        $month = null,
        $day = null,
        $hour = null,
        $minute = null,
        $second = null,
        $timezone = null
    );

    /**
     * Check if the value is a valid date.
     *
     * Must not raise for any input type, including arrays and objects.
     *
     * @param mixed $value The value to check.
     * @return bool Whether the value can be read as a date.
     * @since 1.0.0
     */
    public static function is_valid_date($value);

    /**
     * Get a copy of the instance.
     *
     * @return static The copied instance.
     * @since 1.0.0
     */
    public function copy();

    /**
     * Add the given number of seconds.
     *
     * @param int $value The number of seconds.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_seconds($value = 1);

    /**
     * Add the given number of minutes.
     *
     * @param int $value The number of minutes.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_minutes($value = 1);

    /**
     * Add the given number of hours.
     *
     * @param int $value The number of hours.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_hours($value = 1);

    /**
     * Add the given number of days.
     *
     * @param int $value The number of days.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_days($value = 1);

    /**
     * Add the given number of weeks.
     *
     * @param int $value The number of weeks.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_weeks($value = 1);

    /**
     * Add the given number of months.
     *
     * Expected to overflow into the next month when the resulting month is
     * shorter, matching the native date arithmetic.
     *
     * @param int $value The number of months.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_months($value = 1);

    /**
     * Add the given number of years.
     *
     * @param int $value The number of years.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_years($value = 1);

    /**
     * Subtract the given number of seconds.
     *
     * @param int $value The number of seconds.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_seconds($value = 1);

    /**
     * Subtract the given number of minutes.
     *
     * @param int $value The number of minutes.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_minutes($value = 1);

    /**
     * Subtract the given number of hours.
     *
     * @param int $value The number of hours.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_hours($value = 1);

    /**
     * Subtract the given number of days.
     *
     * @param int $value The number of days.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_days($value = 1);

    /**
     * Subtract the given number of weeks.
     *
     * @param int $value The number of weeks.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_weeks($value = 1);

    /**
     * Subtract the given number of months.
     *
     * @param int $value The number of months.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_months($value = 1);

    /**
     * Subtract the given number of years.
     *
     * @param int $value The number of years.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_years($value = 1);

    /**
     * Add a single second.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_second();

    /**
     * Add a single minute.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_minute();

    /**
     * Add a single hour.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_hour();

    /**
     * Add a single day.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_day();

    /**
     * Add a single week.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_week();

    /**
     * Add a single month.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_month();

    /**
     * Add a single year.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_year();

    /**
     * Subtract a single second.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_second();

    /**
     * Subtract a single minute.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_minute();

    /**
     * Subtract a single hour.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_hour();

    /**
     * Subtract a single day.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_day();

    /**
     * Subtract a single week.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_week();

    /**
     * Subtract a single month.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_month();

    /**
     * Subtract a single year.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_year();

    /**
     * Move the instance to the first moment of its day.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function start_of_day();

    /**
     * Move the instance to the last moment of its day.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function end_of_day();

    /**
     * Move the instance to the first moment of its week, weeks starting on Monday.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function start_of_week();

    /**
     * Move the instance to the last moment of its week, weeks ending on Sunday.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function end_of_week();

    /**
     * Move the instance to the first moment of its month.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function start_of_month();

    /**
     * Move the instance to the last moment of its month.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function end_of_month();

    /**
     * Move the instance to the first moment of its year.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function start_of_year();

    /**
     * Move the instance to the last moment of its year.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function end_of_year();

    /**
     * Move the instance to the first day of its month at midnight.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function first_of_month();

    /**
     * Move the instance to the last day of its month at midnight.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function last_of_month();

    /**
     * Determine whether the instance is equal to the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when both represent the same moment.
     * @since 1.0.0
     */
    public function eq($date);

    /**
     * Determine whether the instance is different from the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when both represent a different moment.
     * @since 1.0.0
     */
    public function ne($date);

    /**
     * Determine whether the instance is later than the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is later.
     * @since 1.0.0
     */
    public function gt($date);

    /**
     * Determine whether the instance is later than or equal to the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is later or equal.
     * @since 1.0.0
     */
    public function gte($date);

    /**
     * Determine whether the instance is earlier than the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is earlier.
     * @since 1.0.0
     */
    public function lt($date);

    /**
     * Determine whether the instance is earlier than or equal to the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is earlier or equal.
     * @since 1.0.0
     */
    public function lte($date);

    /**
     * Determine whether the instance is later than the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is later.
     * @since 1.0.0
     */
    public function is_after($date);

    /**
     * Determine whether the instance is earlier than the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is earlier.
     * @since 1.0.0
     */
    public function is_before($date);

    /**
     * Determine whether the instance falls on the same day as the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when both fall on the same calendar day.
     * @since 1.0.0
     */
    public function is_same_day($date);

    /**
     * Determine whether the instance falls between the given dates, bounds included.
     *
     * @param DateTimeInterface|string|int|float|null $start The lower bound.
     * @param DateTimeInterface|string|int|float|null $end The upper bound.
     * @return bool True when the instance falls within the range.
     * @since 1.0.0
     */
    public function between($start, $end);

    /**
     * Format the instance as a date.
     *
     * @return string The formatted date.
     * @since 1.0.0
     */
    public function to_date_string();

    /**
     * Format the instance as a time.
     *
     * @return string The formatted time.
     * @since 1.0.0
     */
    public function to_time_string();

    /**
     * Format the instance as a date and time.
     *
     * @return string The formatted date and time.
     * @since 1.0.0
     */
    public function to_date_time_string();

    /**
     * Format the instance as an ISO-8601 string keeping the timezone offset.
     *
     * @return string The formatted date and time.
     * @since 1.0.0
     */
    public function to_iso8601_string();

    /**
     * Format the instance the way it is serialized to JSON.
     *
     * Expected to be normalized to UTC and to carry a trailing "Z", because
     * this is the shape API consumers already receive.
     *
     * @return string The formatted date and time.
     * @since 1.0.0
     */
    public function to_json();

    /**
     * Format the instance as a SQL safe date string.
     *
     * @return string The formatted date and time.
     * @since 1.0.0
     */
    public function to_sql_datetime_string();

    /**
     * Get the unix timestamp of the instance.
     *
     * @return int The unix timestamp.
     * @since 1.0.0
     */
    public function get_timestamp();

    /**
     * Get the timezone of the instance.
     *
     * @return \DateTimeZone The timezone.
     * @since 1.0.0
     */
    public function get_timezone();

    /**
     * Move the instance to the given timezone, keeping the same moment in time.
     *
     * @param \DateTimeZone|string $timezone The timezone to move to.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function set_timezone($timezone);

    /**
     * Set the date part of the instance.
     *
     * @param int $year The year.
     * @param int $month The month.
     * @param int $day The day.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function set_date($year, $month, $day);

    /**
     * Set the time part of the instance.
     *
     * @param int $hour The hour.
     * @param int $minute The minute.
     * @param int $second The second.
     * @param int $microsecond The microsecond.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function set_time($hour, $minute, $second = 0, $microsecond = 0);

    /**
     * Set the time part of the instance from a time string.
     *
     * Accepts the shapes a time column holds, such as "10", "10:30",
     * "10:30:45" and "10:30:45.123456". Parts that are not given are reset to
     * zero and the date part is left untouched.
     *
     * @param string $time The time to read.
     * @return $this The mutated instance.
     * @throws \Kirki\Ecommerce\Exceptions\InvalidDateFormatException When the time cannot be read.
     * @since 1.0.0
     */
    public function set_time_from_time_string($time);

    /**
     * Get the value used when the instance is cast to a string.
     *
     * @return string The string representation.
     * @since 1.0.0
     */
    public function __toString();
}
