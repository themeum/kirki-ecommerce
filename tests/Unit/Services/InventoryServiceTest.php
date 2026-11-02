<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\AvailabilityService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Tests\Unit\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

use function Kirki\Ecommerce\Framework\collection;

class InventoryServiceTest extends TestCase
{
    /** @var VariantService&MockObject */
    protected $variant_service;

    protected InventoryService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->variant_service = $this->createMock(VariantService::class);
        $this->service = new InventoryService($this->variant_service, $this->createMock(AvailabilityService::class));
    }

    /**
     * Make the variant lookup return a variant with the given attributes.
     *
     * @param array<string, mixed> $attributes Variant attributes.
     * @return void
     */
    protected function stub_variant(array $attributes): void
    {
        $this->variant_service->method('find_or_null')->willReturn(new Variant($attributes));
    }

    public function test_max_purchasable_quantity_is_capped_to_tracked_stock(): void
    {
        $this->stub_variant(['track_inventory' => true, 'in_stock' => true, 'available_quantity' => 5]);

        $this->assertSame(5, $this->service->max_purchasable_quantity(1, 9));
    }

    public function test_max_purchasable_quantity_keeps_quantity_within_stock(): void
    {
        $this->stub_variant(['track_inventory' => true, 'in_stock' => true, 'available_quantity' => 5]);

        $this->assertSame(4, $this->service->max_purchasable_quantity(1, 4));
    }

    public function test_max_purchasable_quantity_ignores_stock_for_back_order_variant(): void
    {
        $this->stub_variant(['track_inventory' => true, 'in_stock' => true, 'allow_back_order' => true, 'available_quantity' => 0]);

        $this->assertSame(9, $this->service->max_purchasable_quantity(1, 9));
    }

    public function test_max_purchasable_quantity_ignores_stock_for_untracked_in_stock_variant(): void
    {
        $this->stub_variant(['track_inventory' => false, 'in_stock' => true, 'available_quantity' => 0]);

        $this->assertSame(9, $this->service->max_purchasable_quantity(1, 9));
    }

    public function test_untracked_out_of_stock_variant_has_no_stock(): void
    {
        $this->stub_variant(['track_inventory' => false, 'in_stock' => false, 'available_quantity' => 50]);

        $this->assertFalse($this->service->has_stock(1, 1));
    }

    public function test_untracked_in_stock_variant_has_stock_at_any_quantity(): void
    {
        $this->stub_variant(['track_inventory' => false, 'in_stock' => true, 'available_quantity' => 0]);

        $this->assertTrue($this->service->has_stock(1, 3));
    }

    public function test_tracked_variant_ignores_a_false_in_stock_flag(): void
    {
        $this->stub_variant(['track_inventory' => true, 'in_stock' => false, 'available_quantity' => 5]);

        $this->assertTrue($this->service->has_stock(1, 3));
    }

    public function test_tracked_variant_ignores_a_true_in_stock_flag(): void
    {
        $this->stub_variant(['track_inventory' => true, 'in_stock' => true, 'available_quantity' => 0]);

        $this->assertFalse($this->service->has_stock(1, 1));
    }

    public function test_max_purchasable_quantity_is_capped_to_per_order_limit(): void
    {
        $this->stub_variant(['track_inventory' => false, 'in_stock' => true, 'has_limit_per_order' => true, 'max_per_order' => 6]);

        $this->assertSame(6, $this->service->max_purchasable_quantity(1, 9));
    }

    public function test_max_purchasable_quantity_uses_the_stricter_of_stock_and_limit(): void
    {
        $this->stub_variant(['track_inventory' => true, 'in_stock' => true, 'available_quantity' => 3, 'has_limit_per_order' => true, 'max_per_order' => 6]);

        $this->assertSame(3, $this->service->max_purchasable_quantity(1, 9));
    }

    public function test_max_purchasable_quantity_is_zero_when_out_of_stock(): void
    {
        $this->stub_variant(['track_inventory' => true, 'in_stock' => false, 'available_quantity' => -2]);

        $this->assertSame(0, $this->service->max_purchasable_quantity(1, 3));
    }

    public function test_max_purchasable_quantity_returns_the_quantity_for_a_missing_variant(): void
    {
        $this->variant_service->method('find_or_null')->willReturn(null);

        $this->assertSame(3, $this->service->max_purchasable_quantity(1, 3));
    }

    public function test_release_all_reserved_stock_skips_lines_whose_variant_was_deleted(): void
    {
        $order = new Order();
        $order->set_relation('items', collection([
            new OrderItem(['variant_id' => null, 'quantity' => 4]),
            new OrderItem(['variant_id' => 7, 'quantity' => 2]),
        ]));

        $this->stub_variant(['track_inventory' => true]);
        $this->variant_service->expects($this->once())->method('release_committed')->with(7, 2)->willReturn(true);

        $this->service->release_all_reserved_stock($order);
    }
}
