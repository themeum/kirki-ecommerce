<?php

namespace Kirki\Ecommerce\Managers;

use BadMethodCallException;
use Kirki\Ecommerce\Supports\Carbon;
use Kirki\Ecommerce\Supports\Str;

/**
 * @see https://carbon.nesbot.com/docs/
 *
 * @method bool can_be_created_from_format(?string $date, string $format)
 * @method \Kirki\Ecommerce\Supports\Carbon|null create($year = 0, $month = 1, $day = 1, $hour = 0, $minute = 0, $second = 0, $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon create_from_date($year = null, $month = null, $day = null, $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon|null create_from_format($format, $time, $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon|null create_from_iso_format(string $format, string $time, $timezone = null, ?string $locale = 'en', $translator = null)
 * @method \Kirki\Ecommerce\Supports\Carbon|null create_from_locale_format(string $format, string $locale, string $time, $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon|null create_from_locale_iso_format(string $format, string $locale, string $time, $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon create_from_time($hour = 0, $minute = 0, $second = 0, $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon create_from_time_string(string $time, \DateTimeZone|string|int|null $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon create_from_timestamp(string|int|float $timestamp, \DateTimeZone|string|int|null $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon create_from_timestamp_ms(string|int|float $timestamp, \DateTimeZone|string|int|null $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon create_from_timestamp_ms_utc($timestamp)
 * @method \Kirki\Ecommerce\Supports\Carbon create_from_timestamp_utc(string|int|float $timestamp)
 * @method \Kirki\Ecommerce\Supports\Carbon create_midnight_date($year = null, $month = null, $day = null, $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon|null create_safe($year = null, $month = null, $day = null, $hour = null, $minute = null, $second = null, $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon create_strict(?int $year = 0, ?int $month = 1, ?int $day = 1, ?int $hour = 0, ?int $minute = 0, ?int $second = 0, $timezone = null)
 * @method void disable_human_diff_option($humanDiffOption)
 * @method void enable_human_diff_option($humanDiffOption)
 * @method mixed execute_with_locale(string $locale, callable $func)
 * @method \Kirki\Ecommerce\Supports\Carbon from_serialized($value)
 * @method array get_available_locales()
 * @method array get_available_locales_info()
 * @method array get_days()
 * @method ?string get_fallback_locale()
 * @method array get_formats_to_iso_replacements()
 * @method int get_human_diff_options()
 * @method array get_iso_units()
 * @method array|false get_last_errors()
 * @method string get_locale()
 * @method int get_mid_day_at()
 * @method string get_time_format_by_precision(string $unit_precision)
 * @method string|\Closure|null get_translation_message_with($translator, string $key, ?string $locale = null, ?string $default = null)
 * @method \Kirki\Ecommerce\Supports\Carbon|null get_test_now()
 * @method mixed get_translator()
 * @method int get_week_ends_at(?string $locale = null)
 * @method int get_week_starts_at(?string $locale = null)
 * @method array get_weekend_days()
 * @method bool has_format(string $date, string $format)
 * @method bool has_format_with_modifiers(string $date, string $format)
 * @method bool has_macro($name)
 * @method bool has_relative_keywords(?string $time)
 * @method bool has_test_now()
 * @method \Kirki\Ecommerce\Supports\Carbon instance(\DateTimeInterface $date)
 * @method bool is_immutable()
 * @method bool is_modifiable_unit($unit)
 * @method bool is_mutable()
 * @method bool is_strict_mode_enabled()
 * @method bool locale_has_diff_one_day_words(string $locale)
 * @method bool locale_has_diff_syntax(string $locale)
 * @method bool locale_has_diff_two_day_words(string $locale)
 * @method bool locale_has_period_syntax($locale)
 * @method bool locale_has_short_units(string $locale)
 * @method void macro(string $name, ?callable $macro)
 * @method \Kirki\Ecommerce\Supports\Carbon|null make($var, \DateTimeZone|string|null $timezone = null)
 * @method void mixin(object|string $mixin)
 * @method \Kirki\Ecommerce\Supports\Carbon now(\DateTimeZone|string|int|null $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon parse(\DateTimeInterface|\Carbon\WeekDay|\Carbon\Month|string|int|float|null $time, \DateTimeZone|string|int|null $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon parse_from_locale(string $time, ?string $locale = null, \DateTimeZone|string|int|null $timezone = null)
 * @method string plural_unit(string $unit)
 * @method \Kirki\Ecommerce\Supports\Carbon|null raw_create_from_format(string $format, string $time, $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon raw_parse(\DateTimeInterface|\Carbon\WeekDay|\Carbon\Month|string|int|float|null $time, \DateTimeZone|string|int|null $timezone = null)
 * @method void reset_months_overflow()
 * @method void reset_to_string_format()
 * @method void reset_years_overflow()
 * @method void serialize_using($callback)
 * @method void set_fallback_locale(string $locale)
 * @method void set_human_diff_options($human_diff_options)
 * @method void set_locale(string $locale)
 * @method void set_mid_day_at($hour)
 * @method void set_test_now(mixed $test_now = null)
 * @method void set_test_now_and_timezone(mixed $test_now = null, $timezone = null)
 * @method void set_to_string_format(string|\Closure|null $format)
 * @method void set_translator($translator)
 * @method void set_week_ends_at($day)
 * @method void set_week_starts_at($day)
 * @method void set_weekend_days($days)
 * @method bool should_overflow_months()
 * @method bool should_overflow_years()
 * @method string singular_unit(string $unit)
 * @method void sleep(int|float $seconds)
 * @method \Kirki\Ecommerce\Supports\Carbon today(\DateTimeZone|string|int|null $timezone = null)
 * @method \Kirki\Ecommerce\Supports\Carbon tomorrow(\DateTimeZone|string|int|null $timezone = null)
 * @method string translate_time_string(string $time_string, ?string $from = null, ?string $to = null, int $mode = \Carbon\CarbonInterface::TRANSLATE_ALL)
 * @method string translate_with($translator, string $key, array $parameters = [], $number = null)
 * @method void use_months_overflow($months_overflow = true)
 * @method void use_strict_mode($strict_mode_enabled = true)
 * @method void use_years_overflow($years_overflow = true)
 * @method mixed with_test_now(mixed $test_now, callable $callback)
 * @method static with_time_zone(\DateTimeZone|string|int|null $timezone)
 * @method \Kirki\Ecommerce\Supports\Carbon yesterday(\DateTimeZone|string|int|null $timezone = null)
 * @method string to_sql_datetime_string()
 */
class DateManager
{
    /**
     * Handle the Carbon date functions. Forward the date methods from Date Facade to Carbon.
     * 
     * @param string $method
     * @param array $parameters
     * @return mixed
     * @throws BadMethodCallException
     */
    public function __call($method, $parameters)
    {
        $method = Str::camel($method);

        if (!method_exists(Carbon::class, $method)) {
            throw new BadMethodCallException("Call to undefined method Ecommerce\Supports\DateManager::$method");
        }

        return Carbon::$method(...$parameters);
    }
}
