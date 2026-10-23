<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Order\OrderChangeState;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO;
use Kirki\Ecommerce\App\DTO\Order\OrderChangesDTO;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Resources\Order\OrderCalculationResource;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

class OrderCalculationResourceChangeStateTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);
    }

    /**
     * Call a protected resource method.
     *
     * @param OrderCalculationResource $resource  Resource to call.
     * @param string                   $method    Method name.
     * @param mixed                    ...$arguments Arguments.
     * @return mixed
     */
    protected function call(OrderCalculationResource $resource, string $method, ...$arguments)
    {
        $reflection = new \ReflectionMethod(OrderCalculationResource::class, $method);
        $reflection->setAccessible(true);

        return $reflection->invoke($resource, ...$arguments);
    }

    /**
     * Make a model with each attribute set directly, including the ones that are not mass assignable.
     *
     * @param string               $class      Model class.
     * @param array<string, mixed> $attributes Attributes to set.
     * @return mixed
     */
    protected function make_model(string $class, array $attributes)
    {
        $model = new $class();

        foreach ($attributes as $key => $value) {
            $model->$key = $value;
        }

        return $model;
    }

    /**
     * Make a one-line calculation for variant 7, quantity 2, at 25.00 each.
     *
     * @return array{0: CalculationItemDTO[], 1: CalculationResultDTO}
     */
    protected function make_calculation(): array
    {
        $item = new CalculationItemDTO();
        $item->id = 0;
        $item->variant_id = 7;
        $item->quantity = 2;

        $calculated = new CalculationItemDTO();
        $calculated->variant_id = 7;
        $calculated->quantity = 2;
        $calculated->base_catalog_sale_price = 2500;
        $calculated->base_catalog_regular_price = 2500;
        $calculated->base_catalog_product_coupon_discounted_subtotal = 5000;

        $result = new CalculationResultDTO();
        $result->items = [7 => $calculated];

        return [[$item], $result];
    }

    public function test_a_new_order_item_has_no_line_id_an_empty_state_and_live_stock_values(): void
    {
        $variant = $this->make_model(Variant::class, ['id' => 7, 'allow_back_order' => false, 'track_inventory' => true, 'available_quantity' => 4, 'in_stock' => true, 'has_limit_per_order' => true, 'max_per_order' => 3]);
        $resource = new OrderCalculationResource(['variants' => [7 => $variant]]);
        [$items, $result] = $this->make_calculation();

        $rows = $this->call($resource, 'prepare_items', $items, $result, new OrderChangesDTO());

        $this->assertNull($rows[0]['order_item_id']);
        $this->assertSame([], $rows[0]['current_state']);
        $this->assertFalse($rows[0]['allow_back_order']);
        $this->assertTrue($rows[0]['track_inventory']);
        $this->assertSame(4, $rows[0]['available_quantity']);
        $this->assertTrue($rows[0]['in_stock']);
        $this->assertTrue($rows[0]['has_limit_per_order']);
        $this->assertSame(3, $rows[0]['max_per_order']);
    }

    public function test_an_existing_item_carries_its_line_id_and_state(): void
    {
        $order = $this->make_model(Order::class, ['id' => 10]);
        $order->set_relation('items', collection([$this->make_model(OrderItem::class, ['id' => 55, 'variant_id' => 7])]));

        $changes = new OrderChangesDTO();
        $changes->item_states = [55 => [OrderChangeState::PRICE_CHANGED]];

        $resource = new OrderCalculationResource(['order' => $order, 'variants' => []]);
        [$items, $result] = $this->make_calculation();

        $rows = $this->call($resource, 'prepare_items', $items, $result, $changes);

        $this->assertSame(55, $rows[0]['order_item_id']);
        $this->assertSame([OrderChangeState::PRICE_CHANGED], $rows[0]['current_state']);
    }

    public function test_a_deleted_line_becomes_a_row_from_its_stored_amounts(): void
    {
        $changes = new OrderChangesDTO();
        $changes->deleted_items = [$this->make_model(OrderItem::class, [
            'id' => 56,
            'variant_id' => null,
            'quantity' => 2,
            'base_catalog_sale_price' => 2000,
            'base_catalog_regular_price' => 2500,
            'invoiced_catalog_sale_price' => 2000,
            'invoiced_catalog_regular_price' => 2500,
            'base_catalog_product_coupon_discounted_subtotal' => 4000,
        ])];

        $rows = $this->call(new OrderCalculationResource([]), 'prepare_deleted_items', $changes);

        $this->assertCount(1, $rows);
        $this->assertNull($rows[0]['id']);
        $this->assertSame(56, $rows[0]['order_item_id']);
        $this->assertSame(2, $rows[0]['quantity']);
        $this->assertEquals(40.0, $rows[0]['base_subtotal_money_object']->raw);
        $this->assertEquals(50.0, $rows[0]['base_strikethrough_price_money_object']->raw);
        $this->assertSame([], $rows[0]['applied_product_coupons']);
        $this->assertNull($rows[0]['available_quantity']);
        $this->assertNull($rows[0]['max_per_order']);
        $this->assertSame([OrderChangeState::ITEM_DELETED], $rows[0]['current_state']);
    }

    public function test_an_applied_coupon_carries_its_state(): void
    {
        $coupon = $this->make_model(Coupon::class, ['code' => 'SAVE10', 'title' => 'Save', 'discount_target' => DiscountTarget::ORDER]);
        $coupon_result = new CouponDiscountResultDTO();
        $coupon_result->coupon = $coupon;
        $coupon_result->total_discount = 500;

        $changes = new OrderChangesDTO();
        $changes->coupon_states = ['SAVE10' => [OrderChangeState::COUPON_CHANGED]];

        $rows = $this->call(new OrderCalculationResource([]), 'format_coupon_results', [$coupon_result], $changes);

        $this->assertSame([OrderChangeState::COUPON_CHANGED], $rows[0]['current_state']);
    }

    public function test_a_removed_coupon_is_listed_with_a_zero_discount_from_its_snapshot(): void
    {
        $changes = new OrderChangesDTO();
        $changes->removed_coupons = [$this->make_model(OrderCoupon::class, [
            'code' => 'GONE',
            'title' => 'Gone coupon',
            'discount_type' => 'amount_off',
            'discount_target' => DiscountTarget::ORDER,
            'coupon_snapshot' => ['discount_value_type' => 'fixed', 'base_discount_amount_fixed' => 700],
        ])];

        $rows = $this->call(new OrderCalculationResource([]), 'format_removed_coupons', $changes);

        $this->assertSame('GONE', $rows[0]['code']);
        $this->assertSame('Gone coupon', $rows[0]['title']);
        $this->assertSame('fixed', $rows[0]['discount_value_type']);
        $this->assertEquals(7.0, $rows[0]['base_discount_amount_fixed_money_object']->raw);
        $this->assertEquals(0.0, $rows[0]['base_discount_amount_money_object']->raw);
        $this->assertSame([OrderChangeState::COUPON_REMOVED], $rows[0]['current_state']);
    }

    public function test_a_new_order_has_no_removed_coupons_or_deleted_rows(): void
    {
        $resource = new OrderCalculationResource([]);

        $this->assertSame([], $this->call($resource, 'format_removed_coupons', new OrderChangesDTO()));
        $this->assertSame([], $this->call($resource, 'prepare_deleted_items', new OrderChangesDTO()));
    }
}
