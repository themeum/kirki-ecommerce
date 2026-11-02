<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use DateInterval;
use DateTimeImmutable;
use DateTimeZone;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

use function Kirki\Ecommerce\App\client_timezone;

/**
 * Resolves the date range, the comparison range and the chart buckets of an analytics request.
 *
 * All dates are local calendar days (in the time zone of the browser) in `Y-m-d` format.
 *
 * @since 1.0.0
 */
class AnalyticsRangeResolver
{
    const PRESETS = ['today', 'yesterday', 'last_7', 'last_30', 'last_90', 'last_12_months', 'month_to_date', 'year_to_date', 'custom'];

    const COMPARISONS = ['previous_period', 'previous_year', 'custom', 'none'];

    const DEFAULT_PRESET = 'last_30';

    const DEFAULT_COMPARISON = 'previous_period';

    const DAILY_MAX_DAYS = 31;

    const WEEKLY_MAX_DAYS = 186;

    const GRANULARITY_DAY = 'day';

    const GRANULARITY_WEEK = 'week';

    const GRANULARITY_MONTH = 'month';

    /**
     * Get today's date in the time zone of the browser.
     *
     * The `kirki_ecommerce_analytics_today` filter can freeze the date.
     *
     * @since 1.0.0
     *
     * @return string Date in Y-m-d format.
     */
    public function today()
    {
        $frozen = apply_filters('kirki_ecommerce_analytics_today', null);

        if (is_string($frozen) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $frozen)) {
            return $frozen;
        }

        return Date::now(client_timezone())->to_date_string();
    }

    /**
     * Resolve the range, the comparison and the buckets from the request parameters.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated request parameters.
     *
     * @return array<string, mixed> The resolved range, comparison range, granularity and buckets.
     */
    public function resolve(array $params)
    {
        $preset = $params['range'] ?? static::DEFAULT_PRESET;
        $comparison = $params['compare'] ?? static::DEFAULT_COMPARISON;
        [$from, $to] = $this->resolve_range($preset, $params['from'] ?? null, $params['to'] ?? null);
        $days = $this->days_between($from, $to);
        $granularity = $this->resolve_granularity($days);
        $compare = $this->resolve_comparison($comparison, $from, $to, $days, $params['compare_from'] ?? null, $params['compare_to'] ?? null);

        return [
            'preset' => $preset,
            'from' => $from,
            'to' => $to,
            'days' => $days,
            'granularity' => $granularity,
            'compare' => $compare === null ? null : ['from' => $compare[0], 'to' => $compare[1]],
            'buckets' => $this->build_buckets($from, $to, $granularity),
            'previous_buckets' => $compare === null ? [] : $this->build_buckets($compare[0], $compare[1], $granularity),
        ];
    }

    /**
     * Get the first and last day of a preset or custom range.
     *
     * @since 1.0.0
     *
     * @param string      $preset Range preset.
     * @param string|null $from   First day of a custom range.
     * @param string|null $to     Last day of a custom range.
     *
     * @return string[] The first and last day.
     */
    protected function resolve_range(string $preset, $from, $to)
    {
        $today = $this->today();

        switch ($preset) {
            case 'today':
                return [$today, $today];
            case 'yesterday':
                $yesterday = $this->shift_days($today, -1);
                return [$yesterday, $yesterday];
            case 'last_7':
                return [$this->shift_days($today, -6), $today];
            case 'last_90':
                return [$this->shift_days($today, -89), $today];
            case 'last_12_months':
                return [$this->shift_days($this->shift_year($today, -1), 1), $today];
            case 'month_to_date':
                return [substr($today, 0, 8) . '01', $today];
            case 'year_to_date':
                return [substr($today, 0, 4) . '-01-01', $today];
            case 'custom':
                return [(string) $from, (string) $to];
            default:
                return [$this->shift_days($today, -29), $today];
        }
    }

    /**
     * Get the comparison range.
     *
     * @since 1.0.0
     *
     * @param string      $comparison   Comparison type.
     * @param string      $from         First day of the range.
     * @param string      $to           Last day of the range.
     * @param int         $days         Number of days in the range.
     * @param string|null $compare_from First day of a custom comparison.
     * @param string|null $compare_to   Last day of a custom comparison.
     *
     * @return string[]|null The first and last day, or null without a comparison.
     */
    protected function resolve_comparison(string $comparison, string $from, string $to, int $days, $compare_from, $compare_to)
    {
        switch ($comparison) {
            case 'previous_period':
                $previous_to = $this->shift_days($from, -1);
                return [$this->shift_days($previous_to, -($days - 1)), $previous_to];
            case 'previous_year':
                return [$this->shift_year($from, -1), $this->shift_year($to, -1)];
            case 'custom':
                return empty($compare_from) || empty($compare_to) ? null : [(string) $compare_from, (string) $compare_to];
            default:
                return null;
        }
    }

    /**
     * Get the chart granularity of a range.
     *
     * @since 1.0.0
     *
     * @param int $days Number of days in the range.
     *
     * @return string One of day, week or month.
     */
    protected function resolve_granularity(int $days)
    {
        if ($days <= static::DAILY_MAX_DAYS) {
            return static::GRANULARITY_DAY;
        }

        return $days <= static::WEEKLY_MAX_DAYS ? static::GRANULARITY_WEEK : static::GRANULARITY_MONTH;
    }

    /**
     * Split a range into chart buckets.
     *
     * Each bucket has the key SQL groups by, its first and last day inside the range, its label and its span
     * label. The first and last bucket can be partial.
     *
     * @since 1.0.0
     *
     * @param string $from        First day of the range.
     * @param string $to          Last day of the range.
     * @param string $granularity One of day, week or month.
     *
     * @return array<int, array{key: string, start: string, end: string, label: string, span_label: string}>
     */
    public function build_buckets(string $from, string $to, string $granularity)
    {
        $buckets = [];
        $key = $this->bucket_key($from, $granularity);

        while ($key <= $to) {
            $next_key = $this->next_bucket_key($key, $granularity);
            $start = $key < $from ? $from : $key;
            $end = $this->shift_days($next_key, -1);
            $end = $end > $to ? $to : $end;

            $buckets[] = [
                'key' => $key,
                'start' => $start,
                'end' => $end,
                'label' => $this->label($start, $granularity),
                'span_label' => $this->span_label($start, $end),
            ];

            $key = $next_key;
        }

        return $buckets;
    }

    /**
     * Get the key of the bucket a day belongs to.
     *
     * @since 1.0.0
     *
     * @param string $date        Day in Y-m-d format.
     * @param string $granularity One of day, week or month.
     *
     * @return string The day itself, the week start day or the first day of the month.
     */
    public function bucket_key(string $date, string $granularity)
    {
        if ($granularity === static::GRANULARITY_WEEK) {
            return $this->week_start($date);
        }

        if ($granularity === static::GRANULARITY_MONTH) {
            return substr($date, 0, 8) . '01';
        }

        return $date;
    }

    /**
     * Get the day on which the week of a date starts, by the site's start_of_week setting.
     *
     * @since 1.0.0
     *
     * @param string $date Day in Y-m-d format.
     *
     * @return string Week start day in Y-m-d format.
     */
    public function week_start(string $date)
    {
        $start_of_week = (int) get_option('start_of_week', 1);
        $weekday = (int) $this->utc_date($date)->format('w');

        return $this->shift_days($date, -(($weekday - $start_of_week + 7) % 7));
    }

    /**
     * Get the key of the bucket after a bucket.
     *
     * @since 1.0.0
     *
     * @param string $key         Bucket key.
     * @param string $granularity One of day, week or month.
     *
     * @return string Next bucket key.
     */
    protected function next_bucket_key(string $key, string $granularity)
    {
        if ($granularity === static::GRANULARITY_WEEK) {
            return $this->shift_days($key, 7);
        }

        if ($granularity === static::GRANULARITY_MONTH) {
            return $this->utc_date($key)->add(new DateInterval('P1M'))->format('Y-m-d');
        }

        return $this->shift_days($key, 1);
    }

    /**
     * Get the short chart label of a bucket.
     *
     * @since 1.0.0
     *
     * @param string $start       First day of the bucket.
     * @param string $granularity One of day, week or month.
     *
     * @return string Label such as "Oct 3" or "Oct 2026".
     */
    protected function label(string $start, string $granularity)
    {
        $format = $granularity === static::GRANULARITY_MONTH ? 'M Y' : 'M j';

        return wp_date($format, $this->utc_date($start)->getTimestamp(), new DateTimeZone('UTC'));
    }

    /**
     * Get the tooltip label of a bucket, with its first and last day.
     *
     * @since 1.0.0
     *
     * @param string $start First day of the bucket.
     * @param string $end   Last day of the bucket.
     *
     * @return string Label such as "Oct 8, 2026", "Oct 5 – Oct 11, 2026" or "Dec 29, 2025 – Jan 4, 2026".
     */
    protected function span_label(string $start, string $end)
    {
        $zone = new DateTimeZone('UTC');
        $start_ts = $this->utc_date($start)->getTimestamp();
        $end_ts = $this->utc_date($end)->getTimestamp();

        if ($start === $end) {
            return wp_date('M j, Y', $start_ts, $zone);
        }

        $start_format = substr($start, 0, 4) === substr($end, 0, 4) ? 'M j' : 'M j, Y';

        return wp_date($start_format, $start_ts, $zone) . ' – ' . wp_date('M j, Y', $end_ts, $zone);
    }

    /**
     * Count the days in a range, both ends included.
     *
     * @since 1.0.0
     *
     * @param string $from First day.
     * @param string $to   Last day.
     *
     * @return int Number of days.
     */
    protected function days_between(string $from, string $to)
    {
        return (int) $this->utc_date($from)->diff($this->utc_date($to))->format('%a') + 1;
    }

    /**
     * Move a day by a number of days.
     *
     * @since 1.0.0
     *
     * @param string $date Day in Y-m-d format.
     * @param int    $days Days to add; negative to subtract.
     *
     * @return string Day in Y-m-d format.
     */
    protected function shift_days(string $date, int $days)
    {
        return $this->utc_date($date)->modify(sprintf('%+d days', $days))->format('Y-m-d');
    }

    /**
     * Move a day by a number of years, moving Feb 29 to Feb 28.
     *
     * @since 1.0.0
     *
     * @param string $date  Day in Y-m-d format.
     * @param int    $years Years to add; negative to subtract.
     *
     * @return string Day in Y-m-d format.
     */
    protected function shift_year(string $date, int $years)
    {
        $year = (int) substr($date, 0, 4) + $years;
        $month_day = substr($date, 5);

        if ($month_day === '02-29' && !checkdate(2, 29, $year)) {
            $month_day = '02-28';
        }

        return sprintf('%04d-%s', $year, $month_day);
    }

    /**
     * Create a date at midnight UTC, used for calendar arithmetic only.
     *
     * @since 1.0.0
     *
     * @param string $date Day in Y-m-d format.
     *
     * @return DateTimeImmutable
     */
    protected function utc_date(string $date)
    {
        return new DateTimeImmutable($date . ' 00:00:00', new DateTimeZone('UTC'));
    }
}
