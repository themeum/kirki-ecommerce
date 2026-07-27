<?php

namespace Kirki\Ecommerce;

use BadMethodCallException;
use DateTime;
use DateTimeInterface;
use DateTimeZone;
use Exception;
use InvalidArgumentException;
use JsonSerializable;
use Kirki\Ecommerce\Exceptions\InvalidDateFormatException;


/**
 * A mutable date and time value object.
 *
 * Extends the native DateTime so instances keep satisfying the
 * `instanceof DateTimeInterface` checks the query layer relies on, while
 * exposing a snake_case API for everything the plugin needs.
 *
 * Every method this class defines is snake_case. The camelCase methods
 * inherited from DateTime (format(), getTimestamp(), setTimezone(), ...) are
 * still reachable because PHP does not allow hiding them, but each one used by
 * the plugin has a snake_case counterpart below which should be preferred.
 *
 * All mutating methods change the instance in place and return `$this`, so
 * calls can be chained. Use copy() first when the original must be preserved.
 *
 * @since 1.0.0
 */
class Somoy extends DateTime implements JsonSerializable
{
    /**
     * The date only format.
     */
    const DATE_FORMAT = 'Y-m-d';

    /**
     * The time only format.
     */
    const TIME_FORMAT = 'H:i:s';

    /**
     * The combined date and time format.
     */
    const DATETIME_FORMAT = 'Y-m-d H:i:s';

    /**
     * The ISO-8601 format including the timezone offset.
     */
    const ISO8601_FORMAT = 'Y-m-d\TH:i:sP';

    /**
     * The format used when serializing to JSON. Always emitted in UTC with a
     * trailing "Z", so the microseconds are part of the format.
     */
    const JSON_FORMAT = 'Y-m-d\TH:i:s.u';

    /**
     * The units that may be read as properties.
     *
     * @var array
     */
    protected static $readable_units = [
        'year' => 'Y',
        'month' => 'n',
        'day' => 'j',
        'hour' => 'G',
        'minute' => 'i',
        'second' => 's',
        'microsecond' => 'u',
        'timestamp' => 'U',
        'day_of_week' => 'w',
        'day_of_year' => 'z',
        'days_in_month' => 't',
        'week_of_year' => 'W',
    ];

    /**
     * Get an instance for the current date and time.
     *
     * @param DateTimeZone|string|null $timezone The timezone to use.
     * @return static The current date and time.
     * @since 1.0.0
     */
    public static function now($timezone = null)
    {
        return static::parse('now', $timezone);
    }

    /**
     * Get an instance for today at midnight.
     *
     * @param DateTimeZone|string|null $timezone The timezone to use.
     * @return static Today at midnight.
     * @since 1.0.0
     */
    public static function today($timezone = null)
    {
        return static::now($timezone)->start_of_day();
    }

    /**
     * Get an instance for yesterday at midnight.
     *
     * @param DateTimeZone|string|null $timezone The timezone to use.
     * @return static Yesterday at midnight.
     * @since 1.0.0
     */
    public static function yesterday($timezone = null)
    {
        return static::today($timezone)->sub_day();
    }

    /**
     * Get an instance for tomorrow at midnight.
     *
     * @param DateTimeZone|string|null $timezone The timezone to use.
     * @return static Tomorrow at midnight.
     * @since 1.0.0
     */
    public static function tomorrow($timezone = null)
    {
        return static::today($timezone)->add_day();
    }

    /**
     * Parse a value into a date instance.
     *
     * Integers and floats are read as unix timestamps. Null and empty strings
     * resolve to the current date and time.
     *
     * @param DateTimeInterface|string|int|float|null $time The value to parse.
     * @param DateTimeZone|string|null $timezone The timezone to use.
     * @return static The parsed date.
     * @throws InvalidDateFormatException When the value cannot be parsed.
     * @since 1.0.0
     */
    public static function parse($time = null, $timezone = null)
    {
        if ($time instanceof DateTimeInterface) {
            $instance = static::instance($time);

            return $timezone === null ? $instance : $instance->set_timezone($timezone);
        }

        if (is_int($time) || is_float($time)) {
            $instance = static::from_timestamp($time);

            return $timezone === null ? $instance : $instance->set_timezone($timezone);
        }

        // Booleans are cast the way a string context would cast them, so false
        // resolves to the current date and true fails to parse.
        if (is_bool($time)) {
            $time = (string) $time;
        }

        if ($time !== null && !is_string($time)) {
            throw new InvalidDateFormatException(sprintf(
                'Could not parse a value of type %s as a date.',
                gettype($time)
            ));
        }

        try {
            return new static(
                $time === null || $time === '' ? 'now' : $time,
                static::resolve_timezone($timezone)
            );
        } catch (Exception $exception) {
            throw new InvalidDateFormatException(
                sprintf('Could not parse "%s" as a date.', $time),
                0,
                $exception
            );
        }
    }

    /**
     * Create an instance from any other date object.
     *
     * The microseconds and the timezone of the given date are preserved.
     *
     * @param DateTimeInterface $date The date to copy.
     * @return static The new instance.
     * @since 1.0.0
     */
    public static function instance(DateTimeInterface $date)
    {
        return new static(
            $date->format('Y-m-d H:i:s.u'),
            $date->getTimezone() ?: null
        );
    }

    /**
     * Create an instance from a unix timestamp.
     *
     * Unlike parse(), a timestamp without an explicit timezone is expressed in
     * the default timezone rather than in UTC.
     *
     * @param int|float|string $timestamp The unix timestamp.
     * @param DateTimeZone|string|null $timezone The timezone to use.
     * @return static The new instance.
     * @throws InvalidDateFormatException When the timestamp is not numeric.
     * @since 1.0.0
     */
    public static function create_from_timestamp($timestamp, $timezone = null)
    {
        return static::from_timestamp($timestamp)->set_timezone(
            $timezone === null ? date_default_timezone_get() : $timezone
        );
    }

    /**
     * Create an instance from a value matching the given format.
     *
     * @param string $format The format the value is written in.
     * @param string $time The value to read.
     * @param DateTimeZone|string|null $timezone The timezone to use.
     * @return static The new instance.
     * @throws InvalidDateFormatException When the value does not match the format.
     * @since 1.0.0
     */
    public static function create_from_format($format, $time, $timezone = null)
    {
        $timezone = static::resolve_timezone($timezone);

        $date = $timezone === null
            ? DateTime::createFromFormat($format, $time)
            : DateTime::createFromFormat($format, $time, $timezone);

        if (!$date instanceof DateTimeInterface) {
            throw new InvalidDateFormatException(sprintf(
                'Could not parse "%s" using the format "%s".',
                is_scalar($time) ? $time : gettype($time),
                $format
            ));
        }

        return static::instance($date);
    }

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
     * @param DateTimeZone|string|null $timezone The timezone to use.
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
    ) {
        $instance = static::now($timezone);

        return $instance
            ->set_date(
                $year === null ? (int) $instance->format('Y') : (int) $year,
                $month === null ? (int) $instance->format('n') : (int) $month,
                $day === null ? (int) $instance->format('j') : (int) $day
            )
            ->set_time(
                $hour === null ? (int) $instance->format('G') : (int) $hour,
                $minute === null ? (int) $instance->format('i') : (int) $minute,
                $second === null ? (int) $instance->format('s') : (int) $second
            );
    }

    /**
     * Check if the value is a valid date.
     *
     * @param mixed $value
     * @return bool
     * @since 1.0.0
     */
    public static function is_valid_date($value)
    {
        if ($value instanceof DateTimeInterface) {
            return true;
        }

        try {
            static::parse($value);
            return true;
        } catch (InvalidDateFormatException $exception) {
            return false;
        }
    }

    /**
     * Get a copy of the instance.
     *
     * @return static The copied instance.
     * @since 1.0.0
     */
    public function copy()
    {
        return clone $this;
    }

    /**
     * Add the given number of seconds.
     *
     * @param int $value The number of seconds.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_seconds($value = 1)
    {
        return $this->shift('second', $value);
    }

    /**
     * Add the given number of minutes.
     *
     * @param int $value The number of minutes.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_minutes($value = 1)
    {
        return $this->shift('minute', $value);
    }

    /**
     * Add the given number of hours.
     *
     * @param int $value The number of hours.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_hours($value = 1)
    {
        return $this->shift('hour', $value);
    }

    /**
     * Add the given number of days.
     *
     * @param int $value The number of days.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_days($value = 1)
    {
        return $this->shift('day', $value);
    }

    /**
     * Add the given number of weeks.
     *
     * @param int $value The number of weeks.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_weeks($value = 1)
    {
        return $this->shift('week', $value);
    }

    /**
     * Add the given number of months.
     *
     * Overflows into the next month when the resulting month is shorter, which
     * is the behaviour of the native date arithmetic.
     *
     * @param int $value The number of months.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_months($value = 1)
    {
        return $this->shift('month', $value);
    }

    /**
     * Add the given number of years.
     *
     * @param int $value The number of years.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_years($value = 1)
    {
        return $this->shift('year', $value);
    }

    /**
     * Subtract the given number of seconds.
     *
     * @param int $value The number of seconds.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_seconds($value = 1)
    {
        return $this->shift('second', -$value);
    }

    /**
     * Subtract the given number of minutes.
     *
     * @param int $value The number of minutes.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_minutes($value = 1)
    {
        return $this->shift('minute', -$value);
    }

    /**
     * Subtract the given number of hours.
     *
     * @param int $value The number of hours.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_hours($value = 1)
    {
        return $this->shift('hour', -$value);
    }

    /**
     * Subtract the given number of days.
     *
     * @param int $value The number of days.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_days($value = 1)
    {
        return $this->shift('day', -$value);
    }

    /**
     * Subtract the given number of weeks.
     *
     * @param int $value The number of weeks.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_weeks($value = 1)
    {
        return $this->shift('week', -$value);
    }

    /**
     * Subtract the given number of months.
     *
     * @param int $value The number of months.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_months($value = 1)
    {
        return $this->shift('month', -$value);
    }

    /**
     * Subtract the given number of years.
     *
     * @param int $value The number of years.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_years($value = 1)
    {
        return $this->shift('year', -$value);
    }

    /**
     * Add a single second.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_second()
    {
        return $this->add_seconds(1);
    }

    /**
     * Add a single minute.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_minute()
    {
        return $this->add_minutes(1);
    }

    /**
     * Add a single hour.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_hour()
    {
        return $this->add_hours(1);
    }

    /**
     * Add a single day.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_day()
    {
        return $this->add_days(1);
    }

    /**
     * Add a single week.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_week()
    {
        return $this->add_weeks(1);
    }

    /**
     * Add a single month.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_month()
    {
        return $this->add_months(1);
    }

    /**
     * Add a single year.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function add_year()
    {
        return $this->add_years(1);
    }

    /**
     * Subtract a single second.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_second()
    {
        return $this->sub_seconds(1);
    }

    /**
     * Subtract a single minute.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_minute()
    {
        return $this->sub_minutes(1);
    }

    /**
     * Subtract a single hour.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_hour()
    {
        return $this->sub_hours(1);
    }

    /**
     * Subtract a single day.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_day()
    {
        return $this->sub_days(1);
    }

    /**
     * Subtract a single week.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_week()
    {
        return $this->sub_weeks(1);
    }

    /**
     * Subtract a single month.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_month()
    {
        return $this->sub_months(1);
    }

    /**
     * Subtract a single year.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function sub_year()
    {
        return $this->sub_years(1);
    }

    /**
     * Move the instance to the first moment of its day.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function start_of_day()
    {
        return $this->set_time(0, 0, 0, 0);
    }

    /**
     * Move the instance to the last moment of its day.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function end_of_day()
    {
        return $this->set_time(23, 59, 59, 999999);
    }

    /**
     * Move the instance to the first moment of its week, weeks starting on Monday.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function start_of_week()
    {
        return $this->sub_days((int) $this->format('N') - 1)->start_of_day();
    }

    /**
     * Move the instance to the last moment of its week, weeks ending on Sunday.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function end_of_week()
    {
        return $this->start_of_week()->add_days(6)->end_of_day();
    }

    /**
     * Move the instance to the first moment of its month.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function start_of_month()
    {
        return $this
            ->set_date((int) $this->format('Y'), (int) $this->format('n'), 1)
            ->start_of_day();
    }

    /**
     * Move the instance to the last moment of its month.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function end_of_month()
    {
        return $this
            ->set_date((int) $this->format('Y'), (int) $this->format('n'), (int) $this->format('t'))
            ->end_of_day();
    }

    /**
     * Move the instance to the first moment of its year.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function start_of_year()
    {
        return $this->set_date((int) $this->format('Y'), 1, 1)->start_of_day();
    }

    /**
     * Move the instance to the last moment of its year.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function end_of_year()
    {
        return $this->set_date((int) $this->format('Y'), 12, 31)->end_of_day();
    }

    /**
     * Move the instance to the first day of its month at midnight.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function first_of_month()
    {
        return $this->start_of_month();
    }

    /**
     * Move the instance to the last day of its month at midnight.
     *
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function last_of_month()
    {
        return $this
            ->set_date((int) $this->format('Y'), (int) $this->format('n'), (int) $this->format('t'))
            ->start_of_day();
    }

    /**
     * Determine whether the instance is equal to the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when both represent the same moment.
     * @since 1.0.0
     */
    public function eq($date)
    {
        return $this == $this->resolve($date);
    }

    /**
     * Determine whether the instance is different from the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when both represent a different moment.
     * @since 1.0.0
     */
    public function ne($date)
    {
        return !$this->eq($date);
    }

    /**
     * Determine whether the instance is later than the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is later.
     * @since 1.0.0
     */
    public function gt($date)
    {
        return $this > $this->resolve($date);
    }

    /**
     * Determine whether the instance is later than or equal to the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is later or equal.
     * @since 1.0.0
     */
    public function gte($date)
    {
        return $this >= $this->resolve($date);
    }

    /**
     * Determine whether the instance is earlier than the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is earlier.
     * @since 1.0.0
     */
    public function lt($date)
    {
        return $this < $this->resolve($date);
    }

    /**
     * Determine whether the instance is earlier than or equal to the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is earlier or equal.
     * @since 1.0.0
     */
    public function lte($date)
    {
        return $this <= $this->resolve($date);
    }

    /**
     * Determine whether the instance is later than the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is later.
     * @since 1.0.0
     */
    public function is_after($date)
    {
        return $this->gt($date);
    }

    /**
     * Determine whether the instance is earlier than the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when the instance is earlier.
     * @since 1.0.0
     */
    public function is_before($date)
    {
        return $this->lt($date);
    }

    /**
     * Determine whether the instance falls on the same day as the given date.
     *
     * @param DateTimeInterface|string|int|float|null $date The date to compare with.
     * @return bool True when both fall on the same calendar day.
     * @since 1.0.0
     */
    public function is_same_day($date)
    {
        return $this->format(static::DATE_FORMAT) === $this->resolve($date)->format(static::DATE_FORMAT);
    }

    /**
     * Determine whether the instance falls between the given dates, bounds included.
     *
     * @param DateTimeInterface|string|int|float|null $start The lower bound.
     * @param DateTimeInterface|string|int|float|null $end The upper bound.
     * @return bool True when the instance falls within the range.
     * @since 1.0.0
     */
    public function between($start, $end)
    {
        return $this->gte($start) && $this->lte($end);
    }

    /**
     * Format the instance as a date.
     *
     * @return string The formatted date.
     * @since 1.0.0
     */
    public function to_date_string()
    {
        return $this->format(static::DATE_FORMAT);
    }

    /**
     * Format the instance as a time.
     *
     * @return string The formatted time.
     * @since 1.0.0
     */
    public function to_time_string()
    {
        return $this->format(static::TIME_FORMAT);
    }

    /**
     * Format the instance as a date and time.
     *
     * @return string The formatted date and time.
     * @since 1.0.0
     */
    public function to_date_time_string()
    {
        return $this->format(static::DATETIME_FORMAT);
    }

    /**
     * Format the instance as an ISO-8601 string keeping the timezone offset.
     *
     * @return string The formatted date and time.
     * @since 1.0.0
     */
    public function to_iso8601_string()
    {
        return $this->format(static::ISO8601_FORMAT);
    }

    /**
     * Format the instance the way it is serialized to JSON.
     *
     * The value is normalized to UTC and carries a trailing "Z".
     *
     * @return string The formatted date and time.
     * @since 1.0.0
     */
    public function to_json()
    {
        return $this->copy()
            ->set_timezone('UTC')
            ->format(static::JSON_FORMAT) . 'Z';
    }

    /**
     * Convert the instance to a SQL safe date string.
     *
     * @return string The formatted date string.
     * @since 1.0.0
     */
    public function to_sql_datetime_string()
    {
        return $this->format(static::DATETIME_FORMAT);
    }

    /**
     * Get the unix timestamp of the instance.
     *
     * @return int The unix timestamp.
     * @since 1.0.0
     */
    public function get_timestamp()
    {
        return $this->getTimestamp();
    }

    /**
     * Get the timezone of the instance.
     *
     * @return DateTimeZone The timezone.
     * @since 1.0.0
     */
    public function get_timezone()
    {
        return $this->getTimezone();
    }

    /**
     * Move the instance to the given timezone, keeping the same moment in time.
     *
     * @param DateTimeZone|string $timezone The timezone to move to.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function set_timezone($timezone)
    {
        $this->setTimezone(static::resolve_timezone($timezone));

        return $this;
    }

    /**
     * Set the date part of the instance.
     *
     * @param int $year The year.
     * @param int $month The month.
     * @param int $day The day.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    public function set_date($year, $month, $day)
    {
        $this->setDate((int) $year, (int) $month, (int) $day);

        return $this;
    }

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
    public function set_time($hour, $minute, $second = 0, $microsecond = 0)
    {
        $this->setTime((int) $hour, (int) $minute, (int) $second, (int) $microsecond);

        return $this;
    }

    /**
     * Set the time part of the instance from a time string.
     *
     * Accepts the shapes a time column holds, such as "10", "10:30",
     * "10:30:45" and "10:30:45.123456". Parts that are not given are reset to
     * zero, so "10:30" clears the seconds and the microseconds. The date part
     * is left untouched.
     *
     * @param string $time The time to read.
     * @return $this The mutated instance.
     * @throws InvalidDateFormatException When the time cannot be read.
     * @since 1.0.0
     */
    public function set_time_from_time_string($time)
    {
        $given = $time;
        $time = (string) $time;

        // A bare hour is ambiguous to the parser, so give it a minute to read.
        if (strpos($time, ':') === false) {
            $time .= ':0';
        }

        try {
            // Older PHP versions warn and return false instead of throwing.
            $modified = @$this->modify($time);
        } catch (Exception $exception) {
            $modified = false;
        }

        if ($modified === false) {
            throw new InvalidDateFormatException(sprintf(
                'Could not read "%s" as a time.',
                is_scalar($given) ? $given : gettype($given)
            ));
        }

        return $this;
    }

    /**
     * Get the value used when the instance is encoded to JSON.
     *
     * @return string The JSON representation.
     * @since 1.0.0
     */
    public function jsonSerialize(): string
    {
        return $this->to_json();
    }

    /**
     * Get the value used when the instance is cast to a string.
     *
     * @return string The string representation.
     * @since 1.0.0
     */
    public function __toString()
    {
        return $this->to_date_time_string();
    }

    /**
     * Read a single unit of the instance as a property.
     *
     * @param string $name The unit name.
     * @return int The unit value.
     * @throws InvalidArgumentException When the unit is unknown.
     * @since 1.0.0
     */
    public function __get($name)
    {
        if (!isset(static::$readable_units[$name])) {
            throw new InvalidArgumentException(sprintf(
                'Undefined property %s::$%s.',
                static::class,
                $name
            ));
        }

        return (int) $this->format(static::$readable_units[$name]);
    }

    /**
     * Determine whether a unit can be read as a property.
     *
     * @param string $name The unit name.
     * @return bool Whether the unit is readable.
     * @since 1.0.0
     */
    public function __isset($name)
    {
        return isset(static::$readable_units[$name]);
    }

    /**
     * Reject any undefined instance method.
     *
     * The API of this class is snake_case only, so calls are never translated
     * from another naming style.
     *
     * @param string $method The method name.
     * @param array $parameters The method parameters.
     * @return void No return value.
     * @throws BadMethodCallException Always.
     * @since 1.0.0
     */
    public function __call($method, $parameters)
    {
        throw new BadMethodCallException(sprintf(
            'Call to undefined method %s::%s(). Date methods are snake_case.',
            static::class,
            $method
        ));
    }

    /**
     * Reject any undefined static method.
     *
     * @param string $method The method name.
     * @param array $parameters The method parameters.
     * @return void No return value.
     * @throws BadMethodCallException Always.
     * @since 1.0.0
     */
    public static function __callStatic($method, $parameters)
    {
        throw new BadMethodCallException(sprintf(
            'Call to undefined method %s::%s(). Date methods are snake_case.',
            static::class,
            $method
        ));
    }

    /**
     * Shift the instance by the given amount of a single unit.
     *
     * @param string $unit The unit to shift by.
     * @param int $value The signed amount to shift.
     * @return $this The mutated instance.
     * @since 1.0.0
     */
    protected function shift($unit, $value)
    {
        $this->modify(sprintf('%+d %s', (int) $value, $unit));

        return $this;
    }

    /**
     * Normalize a value into a date instance to compare against.
     *
     * @param DateTimeInterface|string|int|float|null $date The value to normalize.
     * @return static The normalized date.
     * @throws InvalidDateFormatException When the value cannot be parsed.
     * @since 1.0.0
     */
    protected function resolve($date)
    {
        return $date instanceof static ? $date : static::parse($date);
    }

    /**
     * Normalize a timezone value into a timezone object.
     *
     * @param DateTimeZone|string|null $timezone The timezone to normalize.
     * @return DateTimeZone|null The timezone, or null when none was given.
     * @throws InvalidDateFormatException When the timezone is unknown.
     * @since 1.0.0
     */
    protected static function resolve_timezone($timezone)
    {
        if ($timezone === null || $timezone instanceof DateTimeZone) {
            return $timezone;
        }

        try {
            return new DateTimeZone($timezone);
        } catch (Exception $exception) {
            throw new InvalidDateFormatException(
                sprintf('Unknown timezone "%s".', is_scalar($timezone) ? $timezone : gettype($timezone)),
                0,
                $exception
            );
        }
    }

    /**
     * Build an instance from a unix timestamp, in UTC.
     *
     * The timestamp is always rendered with six decimal places because the
     * native parser rejects a shorter microsecond fragment.
     *
     * @param int|float|string $timestamp The unix timestamp.
     * @return static The new instance, expressed as a UTC offset.
     * @throws InvalidDateFormatException When the timestamp is not numeric.
     * @since 1.0.0
     */
    protected static function from_timestamp($timestamp)
    {
        if (!is_numeric($timestamp)) {
            throw new InvalidDateFormatException(sprintf(
                'Could not create a date from a non numeric timestamp of type %s.',
                gettype($timestamp)
            ));
        }

        try {
            return new static('@' . sprintf('%.6F', (float) $timestamp));
        } catch (Exception $exception) {
            throw new InvalidDateFormatException(
                sprintf('Could not create a date from the timestamp "%s".', $timestamp),
                0,
                $exception
            );
        }
    }
}
