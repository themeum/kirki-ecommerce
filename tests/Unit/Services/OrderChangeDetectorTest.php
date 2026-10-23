<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Order\OrderChangeState;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\OrderChangeDetector;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Tests\Unit\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

use function Kirki\Ecommerce\Framework\collection;

class OrderChangeDetectorTest extends TestCase
{
    /** @var ShippingService&MockObject */
    protected $shipping_service;

    /** @var bool Tax-inclusive setting the detector sees as current */
    protected $is_tax_inclusive_now = false;

    /** @var array<string, mixed>|null Shipping method the shipping service reports as selected */
    protected $selected_method = ['id' => 'method-0001'];

    protected function setUp(): void
    {
        parent::setUp();

        $this->shipping_service = $this->createMock(ShippingService::class);
        $this->shipping_service->method('get_selected_shipping_method')->willReturnCallback(fn() => $this->selected_method);
    }

    /**
     * Run the detector with the current tax-inclusive setting stubbed.
     *
     * @param Order                 $order   Order as last saved.
     * @param CalculationContextDTO $context Calculation input.
     * @param CalculationResultDTO  $result  Calculation result.
     * @return \Kirki\Ecommerce\App\DTO\Order\OrderChangesDTO
     */
    protected function detect(Order $order, CalculationContextDTO $context, CalculationResultDTO $result)
    {
        $detector = $this->getMockBuilder(OrderChangeDetector::class)
            ->setConstructorArgs([$this->shipping_service])
            ->onlyMethods(['is_tax_inclusive'])
            ->getMock();
        $detector->method('is_tax_inclusive')->willReturn($this->is_tax_inclusive_now);

        return $detector->detect($order, $context, $result);
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
     * Make a stored order with the given lines and coupons.
     *
     * @param OrderItem[]   $items   Stored lines.
     * @param OrderCoupon[] $coupons Stored order coupons.
     * @param array         $columns Order columns.
     * @return Order
     */
    protected function make_order(array $items = [], array $coupons = [], array $columns = []): Order
    {
        $order = $this->make_model(Order::class, array_merge([
            'id' => 10,
            'shipping_method' => 'method-0001',
            'base_shipping_total' => 1000,
            'is_tax_inclusive' => false,
        ], $columns));
        $order->set_relation('items', collection($items));
        $order->set_relation('order_coupons', collection($coupons));

        return $order;
    }

    /**
     * Make a stored line for a variant with its catalog prices.
     *
     * @param int      $id            Order item ID.
     * @param int|null $variant_id    Variant ID; null when the variant was deleted.
     * @param int      $sale_price    Stored catalog sale price.
     * @param int      $regular_price Stored catalog regular price.
     * @return OrderItem
     */
    protected function make_line(int $id, ?int $variant_id, int $sale_price = 2500, int $regular_price = 3000): OrderItem
    {
        return $this->make_model(OrderItem::class, [
            'id' => $id,
            'variant_id' => $variant_id,
            'quantity' => 1,
            'base_catalog_sale_price' => $sale_price,
            'base_catalog_regular_price' => $regular_price,
        ]);
    }

    /**
     * Make a calculation context for the given lines.
     *
     * @param array<int, array{0: int, 1: int, 2: int, 3?: int}> $lines   Each [variant ID, sale price, regular price, quantity].
     * @param string|null                                        $method  Selected shipping method ID.
     * @return CalculationContextDTO
     */
    protected function make_context(array $lines, ?string $method = 'method-0001'): CalculationContextDTO
    {
        $context = new CalculationContextDTO();
        $context->shipping_method_id = $method;
        $context->items = collection(array_map(function ($line) {
            $item = new CalculationItemDTO();
            $item->variant_id = $line[0];
            $item->base_unit_price = $line[1];
            $item->base_product_total = $line[2];
            $item->quantity = $line[3] ?? 1;

            return $item;
        }, $lines));

        return $context;
    }

    /**
     * Make a calculation result with the given applied coupons and shipping total.
     *
     * @param Coupon[] $coupons        Applied coupons.
     * @param int      $shipping_total Shipping total.
     * @return CalculationResultDTO
     */
    protected function make_result(array $coupons = [], int $shipping_total = 1000): CalculationResultDTO
    {
        $result = new CalculationResultDTO();
        $result->base_shipping_total = $shipping_total;
        $result->coupon_results = array_map(function ($coupon) {
            $coupon_result = new CouponDiscountResultDTO();
            $coupon_result->coupon = $coupon;

            return $coupon_result;
        }, $coupons);

        return $result;
    }

    /**
     * Make a percentage coupon targeting products.
     *
     * @param array<string, mixed>              $attributes  Coupon attribute overrides.
     * @param array<int, array{0: int, 1: int}> $product_ids Each [product ID, reward flag].
     * @return Coupon
     */
    protected function make_coupon(array $attributes = [], array $product_ids = [[5, 0]]): Coupon
    {
        $coupon = $this->make_model(Coupon::class, array_merge([
            'id' => 3,
            'code' => 'SAVE10',
            'discount_type' => DiscountType::AMOUNT_OFF,
            'discount_target' => DiscountTarget::PRODUCTS,
            'discount_value_type' => DiscountValueType::PERCENTAGE,
            'discount_amount_percentage' => 10,
            'usage_limit' => 5,
        ], $attributes));

        $coupon->set_relation('products', collection(array_map(function ($product) {
            return $this->make_model(Product::class, ['id' => $product[0], 'pivot' => ['is_reward_item' => $product[1]]]);
        }, $product_ids)));
        $coupon->set_relation('categories', collection());

        return $coupon;
    }

    /**
     * Make a stored order coupon with a snapshot of the given coupon.
     *
     * @param Coupon|null $snapshot_coupon Coupon whose current state is the snapshot; null for an empty snapshot.
     * @param string      $code            Stored code.
     * @return OrderCoupon
     */
    protected function make_order_coupon(?Coupon $snapshot_coupon, string $code = 'SAVE10'): OrderCoupon
    {
        return $this->make_model(OrderCoupon::class, [
            'id' => 30,
            'code' => $code,
            'title' => 'Save 10',
            'coupon_snapshot' => $snapshot_coupon ? $snapshot_coupon->to_array() : [],
        ]);
    }

    public function test_nothing_changed_gives_empty_states(): void
    {
        $coupon = $this->make_coupon();
        $order = $this->make_order([$this->make_line(1, 7)], [$this->make_order_coupon($coupon)]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000]]), $this->make_result([$coupon]));

        $this->assertSame([], $changes->order_state);
        $this->assertSame([], $changes->item_states);
        $this->assertSame([], $changes->coupon_states);
        $this->assertSame([], $changes->deleted_items);
        $this->assertSame([], $changes->removed_coupons);
    }

    public function test_a_line_whose_variant_was_deleted_reports_item_deleted(): void
    {
        $deleted_line = $this->make_line(2, null);
        $order = $this->make_order([$this->make_line(1, 7), $deleted_line]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000]]), $this->make_result());

        $this->assertSame([2 => [OrderChangeState::ITEM_DELETED]], $changes->item_states);
        $this->assertSame([$deleted_line], $changes->deleted_items);
    }

    public function test_a_raised_sale_price_reports_price_changed(): void
    {
        $order = $this->make_order([$this->make_line(1, 7, 2500, 3000)]);

        $changes = $this->detect($order, $this->make_context([[7, 2800, 3000]]), $this->make_result());

        $this->assertSame([1 => [OrderChangeState::PRICE_CHANGED]], $changes->item_states);
    }

    public function test_a_changed_regular_price_alone_reports_price_changed(): void
    {
        $order = $this->make_order([$this->make_line(1, 7, 2500, 3000)]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3500]]), $this->make_result());

        $this->assertSame([1 => [OrderChangeState::PRICE_CHANGED]], $changes->item_states);
    }

    public function test_a_quantity_change_alone_reports_nothing(): void
    {
        $order = $this->make_order([$this->make_line(1, 7)]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000, 4]]), $this->make_result());

        $this->assertSame([], $changes->item_states);
    }

    public function test_a_new_line_reports_nothing(): void
    {
        $order = $this->make_order([$this->make_line(1, 7)]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000], [8, 9900, 9900]]), $this->make_result());

        $this->assertSame([], $changes->item_states);
    }

    public function test_a_stored_coupon_that_no_longer_applies_reports_coupon_removed(): void
    {
        $order_coupon = $this->make_order_coupon($this->make_coupon());
        $order = $this->make_order([$this->make_line(1, 7)], [$order_coupon]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000]]), $this->make_result());

        $this->assertSame(['SAVE10' => [OrderChangeState::COUPON_REMOVED]], $changes->coupon_states);
        $this->assertSame([$order_coupon], $changes->removed_coupons);
    }

    public function test_a_new_code_that_does_not_apply_is_not_reported(): void
    {
        $order = $this->make_order([$this->make_line(1, 7)]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000]]), $this->make_result());

        $this->assertSame([], $changes->coupon_states);
        $this->assertSame([], $changes->removed_coupons);
    }

    public function test_a_raised_percentage_reports_coupon_changed(): void
    {
        $order = $this->make_order([$this->make_line(1, 7)], [$this->make_order_coupon($this->make_coupon())]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000]]), $this->make_result([$this->make_coupon(['discount_amount_percentage' => 15])]));

        $this->assertSame(['SAVE10' => [OrderChangeState::COUPON_CHANGED]], $changes->coupon_states);
    }

    public function test_changed_target_products_report_coupon_changed(): void
    {
        $order = $this->make_order([$this->make_line(1, 7)], [$this->make_order_coupon($this->make_coupon([], [[5, 0]]))]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000]]), $this->make_result([$this->make_coupon([], [[5, 0], [6, 0]])]));

        $this->assertSame(['SAVE10' => [OrderChangeState::COUPON_CHANGED]], $changes->coupon_states);
    }

    public function test_a_changed_reward_flag_reports_coupon_changed(): void
    {
        $order = $this->make_order([$this->make_line(1, 7)], [$this->make_order_coupon($this->make_coupon([], [[5, 0]]))]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000]]), $this->make_result([$this->make_coupon([], [[5, 1]])]));

        $this->assertSame(['SAVE10' => [OrderChangeState::COUPON_CHANGED]], $changes->coupon_states);
    }

    public function test_target_products_in_another_order_report_nothing(): void
    {
        $order = $this->make_order([$this->make_line(1, 7)], [$this->make_order_coupon($this->make_coupon([], [[6, 0], [5, 0]]))]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000]]), $this->make_result([$this->make_coupon([], [[5, 0], [6, 0]])]));

        $this->assertSame([], $changes->coupon_states);
    }

    public function test_a_raised_usage_limit_reports_nothing(): void
    {
        $order = $this->make_order([$this->make_line(1, 7)], [$this->make_order_coupon($this->make_coupon())]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000, 3]]), $this->make_result([$this->make_coupon(['usage_limit' => 50])]));

        $this->assertSame([], $changes->coupon_states);
    }

    public function test_a_number_stored_as_text_reports_nothing(): void
    {
        $snapshot_coupon = $this->make_coupon(['discount_amount_percentage' => '10.00']);
        $order = $this->make_order([$this->make_line(1, 7)], [$this->make_order_coupon($snapshot_coupon)]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000]]), $this->make_result([$this->make_coupon(['discount_amount_percentage' => 10])]));

        $this->assertSame([], $changes->coupon_states);
    }

    public function test_an_empty_snapshot_never_reports_coupon_changed(): void
    {
        $order = $this->make_order([$this->make_line(1, 7)], [$this->make_order_coupon(null)]);

        $changes = $this->detect($order, $this->make_context([[7, 2500, 3000]]), $this->make_result([$this->make_coupon(['discount_amount_percentage' => 50])]));

        $this->assertSame([], $changes->coupon_states);
    }

    public function test_an_unavailable_stored_method_reports_shipping_method_removed_without_a_cost_change(): void
    {
        $this->selected_method = null;
        $order = $this->make_order();

        $changes = $this->detect($order, $this->make_context([]), $this->make_result([], 0));

        $this->assertSame([OrderChangeState::SHIPPING_METHOD_REMOVED], $changes->order_state);
    }

    public function test_another_method_picked_by_the_admin_is_not_reported_as_removed(): void
    {
        $this->selected_method = ['id' => 'method-0002'];
        $order = $this->make_order();

        $changes = $this->detect($order, $this->make_context([], 'method-0002'), $this->make_result([], 1000));

        $this->assertSame([], $changes->order_state);
    }

    public function test_a_different_shipping_total_reports_shipping_cost_changed(): void
    {
        $order = $this->make_order();

        $changes = $this->detect($order, $this->make_context([]), $this->make_result([], 1500));

        $this->assertSame([OrderChangeState::SHIPPING_COST_CHANGED], $changes->order_state);
    }

    public function test_a_removed_free_shipping_coupon_reports_the_coupon_and_the_shipping_cost(): void
    {
        $free_shipping = $this->make_coupon(['code' => 'FREESHIP', 'discount_type' => DiscountType::FREE_SHIPPING]);
        $order = $this->make_order([], [$this->make_order_coupon($free_shipping, 'FREESHIP')], ['base_shipping_total' => 0]);

        $changes = $this->detect($order, $this->make_context([]), $this->make_result([], 1000));

        $this->assertSame(['FREESHIP' => [OrderChangeState::COUPON_REMOVED]], $changes->coupon_states);
        $this->assertSame([OrderChangeState::SHIPPING_COST_CHANGED], $changes->order_state);
    }

    public function test_a_changed_tax_mode_reports_tax_mode_changed(): void
    {
        $this->is_tax_inclusive_now = true;
        $order = $this->make_order();

        $changes = $this->detect($order, $this->make_context([]), $this->make_result());

        $this->assertSame([OrderChangeState::TAX_MODE_CHANGED], $changes->order_state);
    }

    public function test_two_order_changes_are_reported_together(): void
    {
        $this->is_tax_inclusive_now = true;
        $order = $this->make_order();

        $changes = $this->detect($order, $this->make_context([]), $this->make_result([], 1500));

        $this->assertSame([OrderChangeState::SHIPPING_COST_CHANGED, OrderChangeState::TAX_MODE_CHANGED], $changes->order_state);
    }
}
