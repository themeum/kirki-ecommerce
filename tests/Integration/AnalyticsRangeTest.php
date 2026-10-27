<?php

namespace Kirki\Ecommerce\Tests\Integration;

use DateTimeImmutable;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

/**
 * Covers task 4.1 for ranges: presets, comparison ranges, granularity, week alignment and the change value.
 *
 * Today is frozen at 2026-10-14 (a Wednesday). Spec: analytics-metrics (Date range presets,
 * Comparison range, Chart granularity, Store days and weeks).
 */
class AnalyticsRangeTest extends RestTestCase
{
    use SeedsAnalyticsData;

    /**
     * Start every test from an empty store.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_analytics_state();
    }

    /**
     * Scenario "Last 30 days": the range is Sep 15 - Oct 14, 2026 and the response says so.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_last_30_days_range(): void
    {
        $data = $this->overview(['range' => 'last_30']);

        $this->assertSame('last_30', $data['range']['preset']);
        $this->assertSame('2026-09-15', $data['range']['from']);
        $this->assertSame('2026-10-14', $data['range']['to']);
        $this->assertSame(30, $data['range']['days']);
    }

    /**
     * Scenario "Last 12 months": the range is Oct 15, 2025 - Oct 14, 2026.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_last_12_months_range(): void
    {
        $data = $this->overview(['range' => 'last_12_months']);

        $this->assertSame('2025-10-15', $data['range']['from']);
        $this->assertSame('2026-10-14', $data['range']['to']);
    }

    /**
     * Data for the other presets: preset key, first day, last day.
     *
     * @return array
     * @since 1.0.0
     */
    public function preset_ranges(): array
    {
        return [
            'today' => ['today', '2026-10-14', '2026-10-14'],
            'yesterday' => ['yesterday', '2026-10-13', '2026-10-13'],
            'last 7 days' => ['last_7', '2026-10-08', '2026-10-14'],
            'last 90 days' => ['last_90', '2026-07-17', '2026-10-14'],
            'month to date' => ['month_to_date', '2026-10-01', '2026-10-14'],
            'year to date' => ['year_to_date', '2026-01-01', '2026-10-14'],
        ];
    }

    /**
     * Date range presets: every preset ends today (or yesterday) in the site time zone.
     *
     * @dataProvider preset_ranges
     *
     * @param string $preset Preset key.
     * @param string $from   Expected first day.
     * @param string $to     Expected last day.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_preset_ranges(string $preset, string $from, string $to): void
    {
        $data = $this->overview(['range' => $preset]);

        $this->assertSame($from, $data['range']['from']);
        $this->assertSame($to, $data['range']['to']);
    }

    /**
     * Date range presets: a custom range is kept as given.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_a_custom_range_is_kept_as_given(): void
    {
        $data = $this->overview_between('2026-09-01', '2026-09-30');

        $this->assertSame('custom', $data['range']['preset']);
        $this->assertSame('2026-09-01', $data['range']['from']);
        $this->assertSame('2026-09-30', $data['range']['to']);
        $this->assertSame(30, $data['range']['days']);
    }

    /**
     * Scenario "Previous period": the comparison range is Aug 16 - Sep 14, 2026.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_previous_period_comparison_range(): void
    {
        $data = $this->overview(['range' => 'last_30', 'compare' => 'previous_period']);

        $this->assertSame('2026-08-16', $data['compare']['from']);
        $this->assertSame('2026-09-14', $data['compare']['to']);
    }

    /**
     * Comparison range: previous year is the same dates one year earlier.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_previous_year_comparison_range(): void
    {
        $data = $this->overview(['range' => 'last_30', 'compare' => 'previous_year']);

        $this->assertSame('2025-09-15', $data['compare']['from']);
        $this->assertSame('2025-10-14', $data['compare']['to']);
    }

    /**
     * Scenario "Leap day": Feb 29, 2028 compared with the previous year is Feb 28, 2027.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_leap_day_moves_to_feb_28_in_the_previous_year(): void
    {
        $this->freeze_today('2028-03-05');

        $data = $this->overview_between('2028-02-29', '2028-02-29', ['compare' => 'previous_year']);

        $this->assertSame('2027-02-28', $data['compare']['from']);
        $this->assertSame('2027-02-28', $data['compare']['to']);
    }

    /**
     * Comparison range: a custom comparison is used as given.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_custom_comparison_range(): void
    {
        $data = $this->overview(['range' => 'last_30', 'compare' => 'custom', 'compare_from' => '2026-06-01', 'compare_to' => '2026-06-30']);

        $this->assertSame('2026-06-01', $data['compare']['from']);
        $this->assertSame('2026-06-30', $data['compare']['to']);
    }

    /**
     * Comparison range: no comparison gives a null compare and no change.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_no_comparison_gives_null_compare(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000);

        $data = $this->overview(['range' => 'last_30', 'compare' => 'none']);

        $this->assertNull($data['compare']);
        $this->assertNull($data['kpis']['gross_sales']['change']);
        $this->assertNull($data['kpis']['gross_sales']['previous_money_object']);
    }

    /**
     * Scenario "Comparison value is zero": the change is empty, not a percentage.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_change_is_empty_when_the_comparison_value_is_zero(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 50000);

        $data = $this->overview(['range' => 'last_30', 'compare' => 'previous_period']);

        $this->assertSame(50000, $this->minor($data['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(0, $this->minor($data['kpis']['gross_sales']['previous_money_object']));
        $this->assertNull($data['kpis']['gross_sales']['change']);
    }

    /**
     * Comparison range: the change is (current - comparison) / comparison, rounded to one decimal.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_change_is_a_percentage_rounded_to_one_decimal(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 11230);
        $this->make_sale('2026-09-01 10:00:00', 10000);
        $this->make_sale('2026-10-02 10:00:00', 960, [], 1);

        $data = $this->overview(['range' => 'last_30', 'compare' => 'previous_period']);

        // (12190 - 10000) / 10000 = 21.9 %
        $this->assertSame(21.9, (float) $data['kpis']['gross_sales']['change']);
    }

    /**
     * Data for the granularity limits: days in the range and the expected chart granularity.
     *
     * @return array
     * @since 1.0.0
     */
    public function granularity_limits(): array
    {
        return [
            '30 days is daily' => [30, 'day'],
            '31 days is daily' => [31, 'day'],
            '32 days is weekly' => [32, 'week'],
            '186 days is weekly' => [186, 'week'],
            '187 days is monthly' => [187, 'month'],
            '367 days is monthly' => [367, 'month'],
        ];
    }

    /**
     * Scenario "32-day range" and the limits: days up to 31, weeks up to 186, months above.
     *
     * @dataProvider granularity_limits
     *
     * @param int    $days        Number of days in the range.
     * @param string $granularity Expected granularity.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_granularity_by_range_length(int $days, string $granularity): void
    {
        $from = (new DateTimeImmutable(static::$analytics_today))->modify('-' . ($days - 1) . ' days')->format('Y-m-d');

        $data = $this->overview_between($from, static::$analytics_today);

        $this->assertSame($days, $data['range']['days']);
        $this->assertSame($granularity, $data['granularity']);
        $this->assertArrayNotHasKey('granularity_size', $data);
    }

    /**
     * Scenario "7-day range": one point for each day.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_last_7_days_has_a_point_for_each_day(): void
    {
        $series = $this->overview(['range' => 'last_7'])['cards']['total_sales_over_time']['series'];

        $this->assertCount(7, $series);
        $this->assertSame('2026-10-08', $series[0]['date']);
        $this->assertSame('Oct 8, 2026', $series[0]['span_label']);
    }

    /**
     * Scenario "30-day range": one point for each day.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_30_day_range_has_a_point_for_each_day(): void
    {
        $this->make_sale('2026-09-15 10:00:00', 100);
        $this->make_sale('2026-09-16 10:00:00', 200);

        $series = $this->overview(['range' => 'last_30'])['cards']['total_sales_over_time']['series'];

        $this->assertCount(30, $series);
        $this->assertSame('2026-09-15', $series[0]['date']);
        $this->assertSame('Sep 15', $series[0]['label']);
        $this->assertSame('Sep 15, 2026', $series[0]['span_label']);
        $this->assertSame(100, $series[0]['value']);
        $this->assertSame('2026-09-16', $series[1]['date']);
        $this->assertSame(200, $series[1]['value']);
        $this->assertSame('Oct 14, 2026', $series[29]['span_label']);
    }

    /**
     * Scenario "31-day range": one point for each day.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_31_day_range_has_a_point_for_each_day(): void
    {
        $series = $this->overview_between('2026-09-01', '2026-10-01')['cards']['total_sales_over_time']['series'];

        $this->assertCount(31, $series);
        $this->assertSame('2026-10-01', $series[30]['date']);
    }

    /**
     * Scenario "90-day range": one point for each week, the first and last partial.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_90_day_range_has_weekly_points(): void
    {
        update_option('start_of_week', 1);

        $data = $this->overview(['range' => 'last_90']);
        $series = $data['cards']['total_sales_over_time']['series'];

        $this->assertSame('week', $data['granularity']);
        $this->assertCount(14, $series);
        $this->assertSame('2026-07-17', $series[0]['date']);
        $this->assertSame('Jul 17 – Jul 19, 2026', $series[0]['span_label']);
        $this->assertSame('Oct 12 – Oct 14, 2026', $series[13]['span_label']);
    }

    /**
     * Scenario "Comparison points": the comparison has the same daily points from its first day.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_comparison_points_start_on_the_comparison_start(): void
    {
        $series = $this->overview(['range' => 'last_30', 'compare' => 'previous_year'])['cards']['total_sales_over_time']['series'];

        $this->assertCount(30, $series);
        $this->assertSame('2025-09-15', $series[0]['previous_date']);
        $this->assertSame('Sep 15, 2025', $series[0]['previous_span_label']);
        $this->assertSame('2025-09-16', $series[1]['previous_date']);
    }

    /**
     * Scenario "12-month range": one point for each month, labelled with the month and year.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_last_12_months_has_monthly_points(): void
    {
        $data = $this->overview(['range' => 'last_12_months']);
        $series = $data['cards']['total_sales_over_time']['series'];

        $this->assertSame('month', $data['granularity']);
        $this->assertSame('Oct 2026', end($series)['label']);
        $this->assertSame('Oct 1 – Oct 14, 2026', end($series)['span_label']);
    }

    /**
     * Scenario "Two-year range": one point for each month.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_two_year_range_has_a_point_for_each_month(): void
    {
        $this->make_sale('2024-11-20 10:00:00', 100);
        $this->make_sale('2024-12-05 10:00:00', 200);

        $data = $this->overview_between('2024-11-01', '2026-10-14');
        $series = $data['cards']['total_sales_over_time']['series'];

        $this->assertSame('month', $data['granularity']);
        $this->assertCount(24, $series);
        $this->assertSame('2024-11-01', $series[0]['date']);
        $this->assertSame('Nov 2024', $series[0]['label']);
        $this->assertSame('Nov 1 – Nov 30, 2024', $series[0]['span_label']);
        $this->assertSame(100, $series[0]['value']);
        $this->assertSame('2024-12-01', $series[1]['date']);
        $this->assertSame(200, $series[1]['value']);
        $this->assertSame('Oct 1 – Oct 14, 2026', $series[23]['span_label']);
    }

    /**
     * Span labels across two years show the year on both days.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_span_label_across_years_shows_both_years(): void
    {
        update_option('start_of_week', 1);

        $series = $this->overview_between('2025-12-01', '2026-01-31')['cards']['total_sales_over_time']['series'];

        $this->assertSame('2025-12-29', $series[4]['date']);
        $this->assertSame('Dec 29, 2025 – Jan 4, 2026', $series[4]['span_label']);
    }

    /**
     * Scenario "90-day range": each chart point is one week, and the comparison series has the same granularity.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_last_90_days_is_weekly_with_a_matching_comparison_series(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000);

        $data = $this->overview(['range' => 'last_90', 'compare' => 'previous_period']);
        $series = $data['cards']['total_sales_over_time']['series'];

        $this->assertSame('week', $data['granularity']);
        $this->assertSame('2026-07-17', $series[0]['date']);
        $this->assertSame('2026-07-20', $series[1]['date']);
        $this->assertNotNull($series[0]['previous_date']);
        $this->assertCount(count($series), array_filter($series, fn($point) => array_key_exists('previous_value', $point)));
    }

    /**
     * Chart granularity: months group by calendar month.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_monthly_points_group_by_calendar_month(): void
    {
        $this->make_sale('2026-03-10 10:00:00', 1000);
        $this->make_sale('2026-03-25 10:00:00', 500);
        $this->make_sale('2026-05-02 10:00:00', 700);

        $data = $this->overview_between('2026-01-15', '2026-10-14');
        $points = array_column($data['cards']['total_sales_over_time']['series'], null, 'date');

        $this->assertSame('month', $data['granularity']);
        $this->assertSame('2026-01-15', array_key_first($points));
        $this->assertSame(1500, $points['2026-03-01']['value']);
        $this->assertSame(700, $points['2026-05-01']['value']);
        $this->assertSame(0, $points['2026-04-01']['value']);
    }

    /**
     * Scenario "Partial first week": with Monday weeks, a range that starts on a Wednesday has a first point Wed to Sun.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_partial_first_week_covers_wednesday_to_sunday(): void
    {
        update_option('start_of_week', 1);
        $this->make_sale('2026-09-02 10:00:00', 100);
        $this->make_sale('2026-09-06 10:00:00', 200);
        $this->make_sale('2026-09-07 10:00:00', 400);

        $data = $this->overview_between('2026-09-02', '2026-10-14');
        $series = $data['cards']['total_sales_over_time']['series'];

        $this->assertSame('week', $data['granularity']);
        $this->assertSame('2026-09-02', $series[0]['date']);
        $this->assertSame(300, $series[0]['value']);
        $this->assertSame('Sep 2 – Sep 6, 2026', $series[0]['span_label']);
        $this->assertSame('2026-09-07', $series[1]['date']);
        $this->assertSame(400, $series[1]['value']);
    }

    /**
     * Scenario "Sunday week start": each full week runs Sunday to Saturday.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sunday_week_start_groups_sunday_to_saturday(): void
    {
        update_option('start_of_week', 0);
        $this->make_sale('2026-09-06 10:00:00', 100);
        $this->make_sale('2026-09-12 10:00:00', 200);
        $this->make_sale('2026-09-13 10:00:00', 400);

        $data = $this->overview_between('2026-09-02', '2026-10-14');
        $series = $data['cards']['total_sales_over_time']['series'];

        $this->assertSame('2026-09-02', $series[0]['date']);
        $this->assertSame('2026-09-06', $series[1]['date']);
        $this->assertSame(300, $series[1]['value']);
        $this->assertSame('2026-09-13', $series[2]['date']);
        $this->assertSame(400, $series[2]['value']);
        $this->assertSame('Sunday', (new DateTimeImmutable($series[1]['date']))->format('l'));
    }

    /**
     * Store days and weeks: a change of start_of_week needs no rebuild; the next response uses it.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_week_start_change_applies_without_a_rebuild(): void
    {
        $this->make_sale('2026-09-06 10:00:00', 100);
        update_option('start_of_week', 1);
        $monday = $this->overview_between('2026-09-02', '2026-10-14')['cards']['total_sales_over_time']['series'];

        update_option('start_of_week', 0);
        $sunday = $this->overview_between('2026-09-02', '2026-10-14')['cards']['total_sales_over_time']['series'];

        $this->assertSame('2026-09-07', $monday[1]['date']);
        $this->assertSame('2026-09-06', $sunday[1]['date']);
    }

    /**
     * Chart tooltips need labels: every point has a date label and, with a comparison, a comparison label.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_points_have_labels_for_the_range_and_the_comparison(): void
    {
        $data = $this->overview_between('2026-10-01', '2026-10-07', ['compare' => 'previous_period']);
        $point = $data['cards']['total_sales_over_time']['series'][2];

        $this->assertSame('2026-10-03', $point['date']);
        $this->assertSame('Oct 3', $point['label']);
        $this->assertSame('2026-09-26', $point['previous_date']);
        $this->assertSame('Sep 26', $point['previous_label']);
        $this->assertSame('Oct 3, 2026', $point['span_label']);
        $this->assertSame('Sep 26, 2026', $point['previous_span_label']);
    }
}
