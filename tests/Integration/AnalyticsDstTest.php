<?php

namespace Kirki\Ecommerce\Tests\Integration;

use DateTimeImmutable;
use DateTimeZone;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

/**
 * Covers task 12.1: store days across DST changes (spec: analytics-metrics, "Store days and weeks").
 *
 * Today is frozen at 2026-10-14, or at 2026-12-15 where a range ends in November 2026.
 */
class AnalyticsDstTest extends RestTestCase
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
     * Convert a local wall time in a zone to a UTC string.
     *
     * @param string $local Local time, Y-m-d H:i:s.
     * @param string $zone  IANA time zone.
     *
     * @return string
     * @since 1.0.0
     */
    protected function utc(string $local, string $zone): string
    {
        return (new DateTimeImmutable($local, new DateTimeZone($zone)))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
    }

    /**
     * Get the total sales series keyed by date.
     *
     * @param array $data Overview payload.
     *
     * @return array
     * @since 1.0.0
     */
    protected function sales_points(array $data): array
    {
        return array_column($data['cards']['total_sales_over_time']['series'], null, 'date');
    }

    /**
     * Spring forward in America/New_York (2026-03-08): orders either side of the change land on the right local day.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_spring_forward_orders_land_on_their_local_day(): void
    {
        $this->set_timezone('America/New_York');
        $this->make_sale('2026-03-05 15:00:00', 100);  // Mar 5, 10:00 EST.
        $this->make_sale('2026-03-08 04:30:00', 200);  // Mar 7, 23:30 EST.
        $this->make_sale('2026-03-09 03:30:00', 400);  // Mar 8, 23:30 EDT.
        $this->make_sale('2026-03-12 14:00:00', 800);  // Mar 12, 10:00 EDT.

        $data = $this->overview_between('2026-03-01', '2026-03-31');
        $points = $this->sales_points($data);

        $this->assertSame('day', $data['granularity']);
        $this->assertSame(100, $points['2026-03-05']['value']);
        $this->assertSame(200, $points['2026-03-07']['value']);
        $this->assertSame(400, $points['2026-03-08']['value']);
        $this->assertSame(0, $points['2026-03-09']['value']);
        $this->assertSame(800, $points['2026-03-12']['value']);
        $this->assertSame(1500, $this->minor($data['cards']['total_sales_over_time']['total']['current_money_object']));
        $this->assertSame(1500, array_sum(array_column($data['cards']['total_sales_over_time']['series'], 'value')));
    }

    /**
     * Fall back in America/New_York (2026-11-01): the repeated hour stays on Nov 1 and Oct 31 is outside the range.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_fall_back_orders_stay_on_the_same_local_day(): void
    {
        $this->set_timezone('America/New_York');
        $this->freeze_today('2026-12-15');
        $this->make_sale('2026-11-01 03:30:00', 1);     // Oct 31, 23:30 EDT, outside.
        $this->make_sale('2026-11-01 04:30:00', 10);    // Nov 1, 00:30 EDT.
        $this->make_sale('2026-11-01 05:30:00', 20);    // Nov 1, 01:30 EDT.
        $this->make_sale('2026-11-01 06:30:00', 40);    // Nov 1, 01:30 EST.
        $this->make_sale('2026-11-02 04:30:00', 80);    // Nov 1, 23:30 EST.
        $this->make_sale('2026-11-02 05:30:00', 160);   // Nov 2, 00:30 EST.

        $data = $this->overview_between('2026-11-01', '2026-11-30');
        $points = $this->sales_points($data);

        $this->assertSame(150, $points['2026-11-01']['value']);
        $this->assertSame(160, $points['2026-11-02']['value']);
        $this->assertSame(310, $this->minor($data['cards']['total_sales_over_time']['total']['current_money_object']));
        $this->assertSame(310, array_sum(array_column($data['cards']['total_sales_over_time']['series'], 'value')));
    }

    /**
     * A range ending on a day whose local midnight does not exist (America/Santiago, 2026-09-06): the next day is outside.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_range_ending_on_a_dst_gap_day_excludes_the_next_local_day(): void
    {
        $zone = 'America/Santiago';
        $this->set_timezone($zone);
        // The change is 2026-09-06 04:00 UTC (local 00:00 -04 becomes 01:00 -03); local midnight of Sep 7 is 03:00 UTC.
        $this->assertSame('2026-09-07 03:30:00', $this->utc('2026-09-07 00:30:00', $zone));

        $this->make_sale($this->utc('2026-09-06 23:30:00', $zone), 100);  // Sep 6, inside.
        $this->make_sale($this->utc('2026-09-07 00:30:00', $zone), 200);  // Sep 7, outside.

        $data = $this->overview_between('2026-09-01', '2026-09-06');
        $points = $this->sales_points($data);

        $this->assertSame(100, $this->minor($data['cards']['total_sales_over_time']['total']['current_money_object']));
        $this->assertSame(100, $this->breakdown_minor($data, 'total_sales'));
        $this->assertSame(100, $points['2026-09-06']['value']);
        $this->assertSame(100, array_sum(array_column($data['cards']['total_sales_over_time']['series'], 'value')));
    }

    /**
     * A range starting on the DST-gap day includes an order at local 01:30 that day and excludes the evening before.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_range_starting_on_a_dst_gap_day_includes_that_day(): void
    {
        $zone = 'America/Santiago';
        $this->set_timezone($zone);

        $this->make_sale($this->utc('2026-09-05 23:30:00', $zone), 100);  // Sep 5, outside.
        $this->make_sale($this->utc('2026-09-06 01:30:00', $zone), 200);  // Sep 6, inside.

        $data = $this->overview_between('2026-09-06', '2026-09-10');
        $points = $this->sales_points($data);

        $this->assertSame(200, $this->minor($data['cards']['total_sales_over_time']['total']['current_money_object']));
        $this->assertSame(200, $points['2026-09-06']['value']);
    }

    /**
     * The comparison window crossing a DST change uses its own offsets (America/New_York, fall back 2025-11-02).
     *
     * @return void
     * @since 1.0.0
     */
    public function test_comparison_window_uses_its_own_dst_offsets(): void
    {
        $this->set_timezone('America/New_York');
        $this->freeze_today('2026-12-15');
        $this->make_sale('2025-11-02 03:30:00', 1);   // Nov 1, 23:30 EDT.
        $this->make_sale('2025-11-02 04:30:00', 10);  // Nov 2, 00:30 EDT.
        $this->make_sale('2025-11-03 04:30:00', 20);  // Nov 2, 23:30 EST.
        $this->make_sale('2025-11-03 05:30:00', 40);  // Nov 3, 00:30 EST.

        $data = $this->overview_between('2026-11-01', '2026-11-30', ['compare' => 'previous_year']);
        $series = $data['cards']['total_sales_over_time']['series'];

        $this->assertSame('2025-11-01', $data['compare']['from']);
        $this->assertSame('2025-11-01', $series[0]['previous_date']);
        $this->assertSame(1, $series[0]['previous_value']);
        $this->assertSame('2025-11-02', $series[1]['previous_date']);
        $this->assertSame(30, $series[1]['previous_value']);
        $this->assertSame('2025-11-03', $series[2]['previous_date']);
        $this->assertSame(40, $series[2]['previous_value']);
    }
}
