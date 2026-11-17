<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\InventoryType;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

/**
 * Covers GET /dashboard/attention. Spec: home-attention (Needs your attention checks, Attention endpoint).
 */
class DashboardAttentionApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsAnalyticsData;

    /**
     * Start every test from a store with no orders, no products and a store low-stock threshold of 5.
     *
     * @return void
     * @since 1.0.2
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_analytics_state();
        Variant::query()->delete();
        Product::query()->delete();
        Settings::get(OptionKeys::PRODUCT_SETTINGS)->set(['low_stock_threshold' => 5], false);
    }

    /**
     * Get the attention data from the endpoint.
     *
     * @return array
     * @since 1.0.2
     */
    protected function attention(): array
    {
        return $this->assert_api_success($this->request('GET', 'dashboard/attention'))['data'];
    }

    /**
     * Create an order with a payment snapshot.
     *
     * @param string      $payment_status     Payment status.
     * @param string      $fulfillment_status Fulfillment status.
     * @param bool        $offline            Whether the payment method is offline.
     * @param array       $more               Other order attributes.
     * @param string|null $paid_at            Payment time in UTC.
     *
     * @return Order
     * @since 1.0.2
     */
    protected function attention_order(string $payment_status, string $fulfillment_status, bool $offline, array $more = [], ?string $paid_at = null): Order
    {
        return $this->make_order(array_merge([
            'payment_status' => $payment_status,
            'fulfillment_status' => $fulfillment_status,
            'payment_metadata' => ['payment_provider' => ['id' => $offline ? 'bank' : 'paypal', 'name' => 'Method', 'icon' => null, 'is_offline' => $offline]],
        ], $more), [], $paid_at);
    }

    /**
     * Count the rows of a list endpoint.
     *
     * @param string $path   Endpoint path.
     * @param array  $params Query parameters.
     *
     * @return int
     * @since 1.0.2
     */
    protected function list_count(string $path, array $params): int
    {
        $payload = $this->assert_api_success($this->request('GET', $path, array_merge(['limit' => 100], $params)));

        return count($payload['data']['results']);
    }

    /**
     * Build a tracked variant payload.
     *
     * @param int      $quantity  Available quantity.
     * @param int|null $threshold Own low-stock threshold.
     *
     * @return array
     * @since 1.0.2
     */
    protected function tracked_variant(int $quantity, ?int $threshold = null): array
    {
        return [
            'base_price' => 10,
            'sku' => 'ATT-' . wp_generate_password(6, false),
            'available_quantity' => $quantity,
            'in_stock' => $quantity > 0,
            'is_default' => true,
            'track_inventory' => true,
            'low_stock_threshold' => $threshold,
            'attribute_values' => [],
        ];
    }

    /**
     * Scenario "Empty store": every count is 0 and the low-stock rows are empty.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_empty_store_has_zero_counts(): void
    {
        $data = $this->attention();

        $this->assertSame(['count' => 0, 'late_count' => 0], $data['to_ship']);
        $this->assertSame(0, $data['to_collect']['count']);
        $this->assertEquals(0, $data['to_collect']['base_total_money_object']['raw']);
        $this->assertSame(['count' => 0], $data['out_of_stock']);
        $this->assertSame(['total' => 0, 'items' => []], $data['low_stock']);
    }

    /**
     * The order counts equal the order list with the same attention filter, and late orders are counted.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_order_counts_match_the_order_list(): void
    {
        $three_days_ago = Date::now('UTC')->sub_days(3)->to_date_time_string();
        $this->attention_order(PaymentStatus::PAID, FulfillmentStatus::UNFULFILLED, false, [], $three_days_ago);
        $this->attention_order(PaymentStatus::PAID, FulfillmentStatus::PROCESSING, false, [], Date::now('UTC')->to_date_time_string());
        $this->attention_order(PaymentStatus::UNPAID, FulfillmentStatus::UNFULFILLED, true, ['base_total' => 4000]);
        $this->attention_order(PaymentStatus::UNPAID, FulfillmentStatus::DELIVERED, true, ['base_total' => 6000]);
        $this->attention_order(PaymentStatus::UNPAID, FulfillmentStatus::UNFULFILLED, false);

        $data = $this->attention();

        $this->assertSame(3, $data['to_ship']['count']);
        $this->assertSame(1, $data['to_ship']['late_count']);
        $this->assertSame($this->list_count('orders', ['attention' => 'to_ship']), $data['to_ship']['count']);
        $this->assertSame(2, $data['to_collect']['count']);
        $this->assertSame($this->list_count('orders', ['attention' => 'to_collect']), $data['to_collect']['count']);
        $this->assertEquals(100, $data['to_collect']['base_total_money_object']['raw']);
    }

    /**
     * Scenario "Same count as the inventory filter", and the low-stock rows are fewest first.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_stock_counts_match_the_inventory_list(): void
    {
        $this->create_product(['title' => 'Empty mug', 'variants' => [$this->tracked_variant(0)]]);
        $this->create_product(['title' => 'Four left', 'variants' => [$this->tracked_variant(4)]]);
        $this->create_product(['title' => 'One left', 'variants' => [$this->tracked_variant(1)]]);
        $this->create_product(['title' => 'Own threshold', 'variants' => [$this->tracked_variant(8, 10)]]);
        $this->create_product(['title' => 'Plenty', 'variants' => [$this->tracked_variant(50)]]);

        $data = $this->attention();

        $this->assertSame(1, $data['out_of_stock']['count']);
        $this->assertSame($this->list_count('variants', ['inventory_type' => InventoryType::OUT_OF_STOCK]), $data['out_of_stock']['count']);
        $this->assertSame(3, $data['low_stock']['total']);
        $this->assertSame($this->list_count('variants', ['inventory_type' => InventoryType::LOW_STOCK]), $data['low_stock']['total']);
        $this->assertSame(['One left', 'Four left', 'Own threshold'], array_column($data['low_stock']['items'], 'product_name'));
        $this->assertSame([1, 4, 8], array_column($data['low_stock']['items'], 'available_quantity'));
        $this->assertSame(
            ['variant_id', 'product_id', 'product_name', 'variant_name', 'image', 'available_quantity'],
            array_keys($data['low_stock']['items'][0])
        );
    }
}
