<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class FirstSaleApiTest extends RestTestCase
{
    /**
     * Start every test from a store with no orders and no first-sale state.
     *
     * @return void
     * @since 1.0.2
     */
    protected function setUp(): void
    {
        parent::setUp();
        Refund::query()->delete();
        OrderItem::query()->delete();
        Order::query()->delete();
        Option::delete(OptionKeys::FIRST_SALE);

        if (!Currency::query()->where('is_base', true)->exists()) {
            Currency::create(['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 1, 'is_base' => true, 'is_active' => true]);
        }
    }

    /**
     * A store with no orders shows no card and no celebration.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_store_without_orders_has_no_card(): void
    {
        $state = $this->get_state();

        $this->assertFalse($state['is_visible']);
        $this->assertFalse($state['should_celebrate']);
        $this->assertNull($state['order']);
    }

    /**
     * The oldest order that is not archived is the first order, whatever its payment status.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_first_order_is_the_oldest_not_archived_order(): void
    {
        $this->create_order(['archived_at' => '2026-01-01 00:00:00'], '2026-01-01 00:00:00');
        $second = $this->create_order(['payment_status' => PaymentStatus::UNPAID, 'customer_first_name' => 'Ibrahim', 'customer_last_name' => 'Fischer', 'invoiced_total' => 4388], '2026-01-02 00:00:00');
        $this->create_order([], '2026-01-03 00:00:00');

        $state = $this->get_state();

        $this->assertTrue($state['is_visible']);
        $this->assertTrue($state['should_celebrate']);
        $this->assertSame($second->id, $state['order']['id']);
        $this->assertSame('Ibrahim Fischer', $state['order']['customer_name']);
        $this->assertEqualsWithDelta(43.88, $state['order']['invoiced_total_money_object']['raw'], 0.001);
    }

    /**
     * Orders created at the same time are ordered by id, and a deleted first order gives way to the next.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_ties_use_the_lower_id_and_deleted_order_falls_back(): void
    {
        $first = $this->create_order([], '2026-01-02 00:00:00');
        $second = $this->create_order([], '2026-01-02 00:00:00');

        $this->assertSame($first->id, $this->get_state()['order']['id']);

        Order::query()->where('id', $first->id)->delete();

        $this->assertSame($second->id, $this->get_state()['order']['id']);
    }

    /**
     * A store whose every order is archived has no first order.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_every_order_archived_has_no_card(): void
    {
        $this->create_order(['archived_at' => '2026-01-01 00:00:00']);

        $state = $this->get_state();

        $this->assertFalse($state['is_visible']);
        $this->assertNull($state['order']);
    }

    /**
     * Each admin is celebrated once, and the first time is kept.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_each_admin_is_celebrated_once(): void
    {
        $this->create_order();
        $admin_a = get_current_user_id();

        $state = $this->post('celebrated');
        $this->assertTrue($state['is_visible']);
        $this->assertFalse($state['should_celebrate']);

        $first_time = Option::get(OptionKeys::FIRST_SALE)['celebrated'][$admin_a];
        $this->assert_api_success($this->request('POST', 'home/first-sale/celebrated'));
        $this->reset_option_manager_cache();
        $this->assertSame($first_time, Option::get(OptionKeys::FIRST_SALE)['celebrated'][$admin_a]);

        $this->login_as_admin();
        $this->assertTrue($this->get_state()['should_celebrate']);
    }

    /**
     * Closing the card hides it for that admin only and ends their celebration.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_dismiss_hides_the_card_for_one_admin(): void
    {
        $this->create_order();

        $state = $this->post('dismiss');
        $this->assertFalse($state['is_visible']);
        $this->assertFalse($state['should_celebrate']);
        $this->assertFalse($this->get_state()['is_visible']);

        $this->login_as_admin();
        $this->assertTrue($this->get_state()['is_visible']);
    }

    /**
     * "Fulfill order" hides the card for every admin and clears every close record.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_fulfill_hides_the_card_for_every_admin(): void
    {
        $this->create_order();
        $this->post('dismiss');

        $this->login_as_admin();
        $state = $this->post('fulfill');
        $this->assertFalse($state['is_visible']);
        $this->assertFalse($state['should_celebrate']);

        $this->reset_option_manager_cache();
        $stored = Option::get(OptionKeys::FIRST_SALE);
        $this->assertIsInt($stored['done_at']);
        $this->assertSame([], $stored['dismissed']);

        $this->login_as_admin();
        $state = $this->get_state();
        $this->assertFalse($state['is_visible']);
        $this->assertFalse($state['should_celebrate']);
    }

    /**
     * A malformed stored value reads as the empty state.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_malformed_option_reads_as_empty_state(): void
    {
        $this->create_order();
        Option::set(OptionKeys::FIRST_SALE, 'broken');
        $this->reset_option_manager_cache();

        $this->assertTrue($this->get_state()['should_celebrate']);
    }

    /**
     * Read the first-sale state for the current user.
     *
     * @return array
     * @since 1.0.2
     */
    protected function get_state(): array
    {
        $this->reset_option_manager_cache();

        return $this->assert_api_success($this->request('GET', 'home/first-sale'))['data'];
    }

    /**
     * Send a first-sale write for the current user.
     *
     * @param string $action celebrated, dismiss or fulfill.
     *
     * @return array
     * @since 1.0.2
     */
    protected function post(string $action): array
    {
        return $this->assert_api_success($this->request('POST', 'home/first-sale/' . $action))['data'];
    }

    /**
     * Create a paid USD order with an optional creation time.
     *
     * @param array       $attributes Order attributes.
     * @param string|null $created_at Creation time, if it matters.
     *
     * @return Order
     * @since 1.0.2
     */
    protected function create_order(array $attributes = [], $created_at = null): Order
    {
        $order = Order::create(array_merge([
            'currency_code' => 'USD',
            'base_currency_code' => 'USD',
            'payment_status' => PaymentStatus::PAID,
        ], $attributes));

        if ($created_at !== null) {
            Order::query()->where('id', $order->id)->update(['created_at' => $created_at]);
        }

        return $order;
    }
}
