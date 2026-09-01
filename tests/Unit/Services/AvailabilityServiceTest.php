<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\AvailabilityService;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class AvailabilityServiceTest extends TestCase
{
    protected AvailabilityService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new AvailabilityService();
    }

    // Layer 1

    public function test_untracked_variant_in_stock_flag_true_is_in_stock(): void
    {
        $status = $this->service->resolve_variant_status(new Variant([
            'track_inventory' => false,
            'in_stock' => true,
            'available_quantity' => 0,
            'low_stock_threshold' => null,
        ]), 0);

        $this->assertSame(AvailabilityStatus::IN_STOCK, $status);
    }

    public function test_untracked_variant_in_stock_flag_false_is_out_of_stock(): void
    {
        $status = $this->service->resolve_variant_status(new Variant([
            'track_inventory' => false,
            'in_stock' => false,
            'available_quantity' => 999,
            'low_stock_threshold' => null,
        ]), 0);

        $this->assertSame(AvailabilityStatus::OUT_OF_STOCK, $status);
    }

    public function test_tracked_variant_at_zero_quantity_is_out_of_stock(): void
    {
        $status = $this->service->resolve_variant_status(new Variant([
            'track_inventory' => true,
            'in_stock' => true,
            'available_quantity' => 0,
            'low_stock_threshold' => null,
        ]), 5);

        $this->assertSame(AvailabilityStatus::OUT_OF_STOCK, $status);
    }

    public function test_tracked_variant_at_threshold_is_low_stock(): void
    {
        $status = $this->service->resolve_variant_status(new Variant([
            'track_inventory' => true,
            'in_stock' => true,
            'available_quantity' => 3,
            'low_stock_threshold' => 3,
        ]), 0);

        $this->assertSame(AvailabilityStatus::LOW_STOCK, $status);
    }

    public function test_tracked_variant_above_threshold_is_in_stock(): void
    {
        $status = $this->service->resolve_variant_status(new Variant([
            'track_inventory' => true,
            'in_stock' => true,
            'available_quantity' => 4,
            'low_stock_threshold' => 3,
        ]), 0);

        $this->assertSame(AvailabilityStatus::IN_STOCK, $status);
    }

    public function test_zero_threshold_never_yields_low_stock(): void
    {
        $status = $this->service->resolve_variant_status(new Variant([
            'track_inventory' => true,
            'in_stock' => true,
            'available_quantity' => 1,
            'low_stock_threshold' => 0,
        ]), 5);

        $this->assertSame(AvailabilityStatus::IN_STOCK, $status);
    }

    public function test_back_order_at_zero_quantity_still_reports_out_of_stock(): void
    {
        $status = $this->service->resolve_variant_status(new Variant([
            'track_inventory' => true,
            'in_stock' => true,
            'available_quantity' => 0,
            'low_stock_threshold' => null,
        ]), 0);

        $this->assertSame(AvailabilityStatus::OUT_OF_STOCK, $status);
    }

    public function test_null_threshold_falls_back_to_store_default(): void
    {
        $low_stock = $this->service->resolve_variant_status(new Variant([
            'track_inventory' => true,
            'in_stock' => true,
            'available_quantity' => 5,
            'low_stock_threshold' => null,
        ]), 5);
        $in_stock = $this->service->resolve_variant_status(new Variant([
            'track_inventory' => true,
            'in_stock' => true,
            'available_quantity' => 6,
            'low_stock_threshold' => null,
        ]), 5);

        $this->assertSame(AvailabilityStatus::LOW_STOCK, $low_stock);
        $this->assertSame(AvailabilityStatus::IN_STOCK, $in_stock);
    }

    public function test_explicit_zero_threshold_does_not_fall_back_to_store_default(): void
    {
        $status = $this->service->resolve_variant_status(new Variant([
            'track_inventory' => true,
            'in_stock' => true,
            'available_quantity' => 5,
            'low_stock_threshold' => 0,
        ]), 5);

        $this->assertSame(AvailabilityStatus::IN_STOCK, $status);
    }

    // Layer 2

    public function test_all_in_stock_resolves_to_in_stock(): void
    {
        $status = $this->service->resolve_group_status([
            AvailabilityStatus::IN_STOCK,
            AvailabilityStatus::IN_STOCK,
        ]);

        $this->assertSame(AvailabilityStatus::IN_STOCK, $status);
    }

    public function test_a_low_stock_variant_outweighs_healthy_ones(): void
    {
        $status = $this->service->resolve_group_status([
            AvailabilityStatus::IN_STOCK,
            AvailabilityStatus::LOW_STOCK,
        ]);

        $this->assertSame(AvailabilityStatus::LOW_STOCK, $status);
    }

    public function test_some_available_some_gone_is_partially_stocked(): void
    {
        $status = $this->service->resolve_group_status([
            AvailabilityStatus::IN_STOCK,
            AvailabilityStatus::OUT_OF_STOCK,
        ]);

        $this->assertSame(AvailabilityStatus::PARTIALLY_STOCKED, $status);
    }

    public function test_a_low_stock_variant_outweighs_a_partial_mix(): void
    {
        $status = $this->service->resolve_group_status([
            AvailabilityStatus::IN_STOCK,
            AvailabilityStatus::OUT_OF_STOCK,
            AvailabilityStatus::LOW_STOCK,
        ]);

        $this->assertSame(AvailabilityStatus::LOW_STOCK, $status);
    }

    public function test_everything_out_of_stock_resolves_to_out_of_stock(): void
    {
        $status = $this->service->resolve_group_status([
            AvailabilityStatus::OUT_OF_STOCK,
            AvailabilityStatus::OUT_OF_STOCK,
        ]);

        $this->assertSame(AvailabilityStatus::OUT_OF_STOCK, $status);
    }

    public function test_group_status_does_not_depend_on_order(): void
    {
        $first = $this->service->resolve_group_status([
            AvailabilityStatus::IN_STOCK,
            AvailabilityStatus::OUT_OF_STOCK,
            AvailabilityStatus::LOW_STOCK,
        ]);

        $second = $this->service->resolve_group_status([
            AvailabilityStatus::IN_STOCK,
            AvailabilityStatus::LOW_STOCK,
            AvailabilityStatus::OUT_OF_STOCK,
        ]);

        $this->assertSame(AvailabilityStatus::LOW_STOCK, $first);
        $this->assertSame($first, $second);
    }

    public function test_single_variant_group_reports_its_own_status(): void
    {
        $status = $this->service->resolve_group_status([AvailabilityStatus::LOW_STOCK]);

        $this->assertSame(AvailabilityStatus::LOW_STOCK, $status);
    }

    public function test_empty_group_reports_no_status(): void
    {
        $status = $this->service->resolve_group_status([]);

        $this->assertNull($status);
    }

    // resolve_product_status glue

    public function test_resolve_product_status_combines_both_layers(): void
    {
        $variants = [
            new Variant(['track_inventory' => true, 'in_stock' => true, 'available_quantity' => 10, 'low_stock_threshold' => null]),
            new Variant(['track_inventory' => true, 'in_stock' => true, 'available_quantity' => 0, 'low_stock_threshold' => null]),
        ];

        $status = $this->service->resolve_product_status($variants, 0);

        $this->assertSame(AvailabilityStatus::PARTIALLY_STOCKED, $status);
    }

    public function test_resolve_product_status_with_no_variants_reports_no_status(): void
    {
        $status = $this->service->resolve_product_status([], 0);

        $this->assertNull($status);
    }

    // format_status_label

    public function test_format_status_label_prefixes_quantity_for_in_stock(): void
    {
        $label = $this->service->format_status_label(AvailabilityStatus::IN_STOCK, 12);

        $this->assertSame('12 In Stock', $label);
    }

    public function test_format_status_label_falls_back_to_plain_label_when_quantity_is_zero(): void
    {
        $label = $this->service->format_status_label(AvailabilityStatus::IN_STOCK, 0);

        $this->assertSame(AvailabilityStatus::get_formatted(AvailabilityStatus::IN_STOCK), $label);
    }

    public function test_format_status_label_ignores_quantity_for_other_statuses(): void
    {
        $label = $this->service->format_status_label(AvailabilityStatus::LOW_STOCK, 3);

        $this->assertSame(AvailabilityStatus::get_formatted(AvailabilityStatus::LOW_STOCK), $label);
    }

    public function test_format_status_label_appends_variant_count_when_given(): void
    {
        $label = $this->service->format_status_label(AvailabilityStatus::IN_STOCK, 120, 9);

        $this->assertSame('120 In Stock across 9 variants', $label);
    }

    public function test_format_status_label_appends_variant_count_for_non_in_stock_statuses(): void
    {
        $label = $this->service->format_status_label(AvailabilityStatus::OUT_OF_STOCK, 0, 20);

        $this->assertSame(AvailabilityStatus::get_formatted(AvailabilityStatus::OUT_OF_STOCK) . ' across 20 variants', $label);
    }

    public function test_format_status_label_omits_variant_suffix_when_variant_count_is_null(): void
    {
        $label = $this->service->format_status_label(AvailabilityStatus::LOW_STOCK, 3, null);

        $this->assertSame(AvailabilityStatus::get_formatted(AvailabilityStatus::LOW_STOCK), $label);
    }
}
