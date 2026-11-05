<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Resources\Order\OrderActivityResource;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderActivityResource as SiteOrderActivityResource;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

/**
 * Covers task 2.4: order activities that the AI assistant causes are marked.
 *
 * Spec: mcp-write-tool-conventions (Order changes are marked as made by the AI assistant).
 */
class OrderActivityAssistantMarkTest extends RestTestCase
{
    use SeedsAnalyticsData;

    /**
     * Start every test from an empty store and an administrator.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_analytics_state();
        wp_set_current_user(static::factory()->user->create(['role' => 'administrator']));
    }

    /**
     * Scenario "Shipped through the assistant": the admin resource has the mark and the author.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_activity_from_the_assistant_is_marked(): void
    {
        $order = $this->make_order(['order_number' => 'KE-1']);

        $activity = OrderActivity::as_assistant(function () use ($order) {
            return OrderActivity::log($order, OrderActivityType::SHIPPED);
        });

        $admin = OrderActivityResource::make($activity);

        $this->assertTrue($admin['via_ai_assistant']);
        $this->assertSame(get_current_user_id(), (int) $admin['created_by']);
    }

    /**
     * Scenario "Customer view": the site resource has no mark.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customer_view_has_no_mark(): void
    {
        $order = $this->make_order(['order_number' => 'KE-2']);

        $activity = OrderActivity::as_assistant(function () use ($order) {
            return OrderActivity::log($order, OrderActivityType::SHIPPED);
        });

        $site = SiteOrderActivityResource::make($activity);

        $this->assertArrayNotHasKey('via_ai_assistant', $site);
        $this->assertSame(['activity_type', 'created_at'], array_keys($site));
    }

    /**
     * Scenario "Admin action": an activity outside the assistant has no mark, and a comment keeps its notify flag.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_admin_activity_has_no_mark(): void
    {
        $order = $this->make_order(['order_number' => 'KE-3']);

        $admin = OrderActivityResource::make(OrderActivity::log($order, OrderActivityType::SHIPPED));
        $this->assertFalse($admin['via_ai_assistant']);

        $comment = OrderActivity::as_assistant(function () use ($order) {
            return OrderActivity::comment((int) $order->id, 'Ships Monday', null, true);
        });
        $comment_data = OrderActivityResource::make($comment);

        $this->assertTrue($comment_data['via_ai_assistant']);
        $this->assertTrue($comment_data['notify_customer']);
    }
}
