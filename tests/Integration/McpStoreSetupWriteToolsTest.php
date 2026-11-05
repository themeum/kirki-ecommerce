<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Mcp\Tools\FixStorePagesTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdateEmailNotificationTool;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\RunsWriteTools;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 5.8: the store setup write tools.
 *
 * Spec: mcp-store-setup-write-tools, and mcp-write-tool-conventions for the annotations.
 */
class McpStoreSetupWriteToolsTest extends RestTestCase
{
    use RunsWriteTools;

    /**
     * Start every test with an administrator and all store pages.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->login_as_admin();
        Utils::generate_site_pages();
    }

    /**
     * Scenario "Nothing missing".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_nothing_missing(): void
    {
        $response = $this->run_tool(FixStorePagesTool::class, []);

        $this->assertFalse($response->is_error());
        $this->assertSame('nothing_to_do', $response->content()['status']);
        $this->assertArrayNotHasKey('confirmation_token', $response->content());
    }

    /**
     * Scenario "Checkout page deleted".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_page_deleted(): void
    {
        $old_page_id = (int) Utils::get_checkout_page_id();
        wp_delete_post($old_page_id, true);

        $preview = $this->preview(FixStorePagesTool::class, []);
        $this->assertCount(1, $preview['changes']['pages_to_create']);

        $this->confirm(FixStorePagesTool::class, []);

        $new_page_id = (int) Utils::get_checkout_page_id();
        $this->assertNotSame($old_page_id, $new_page_id);
        $this->assertSame('publish', get_post_status($new_page_id));
    }

    /**
     * Scenario "Draft cart page".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_draft_cart_page(): void
    {
        $cart_page_id = (int) Utils::get_cart_page_id();
        wp_update_post(['ID' => $cart_page_id, 'post_status' => 'draft']);

        $preview = $this->preview(FixStorePagesTool::class, []);
        $this->assertSame($cart_page_id, $preview['changes']['pages_to_publish'][0]['page_id']);

        $this->confirm(FixStorePagesTool::class, []);

        $this->assertSame($cart_page_id, (int) Utils::get_cart_page_id());
        $this->assertSame('publish', get_post_status($cart_page_id));
    }

    /**
     * Scenario "Turn off the on-hold email": the other notifications and the message do not change.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_turn_off_the_on_hold_email(): void
    {
        $settings = Settings::get(OptionKeys::EMAIL_SETTINGS);
        $message = $settings->get('customer_emails.order_notifications.order_on_hold.message');
        $arguments = ['recipient' => 'customer', 'group' => 'order_notifications', 'key' => 'order_on_hold', 'is_enabled' => false];

        $done = $this->confirm(UpdateEmailNotificationTool::class, $arguments);

        $settings = Settings::get(OptionKeys::EMAIL_SETTINGS);
        $this->assertFalse($done['is_enabled']);
        $this->assertFalse((bool) $settings->get('customer_emails.order_notifications.order_on_hold.is_enabled'));
        $this->assertSame($message, $settings->get('customer_emails.order_notifications.order_on_hold.message'));
        $this->assertTrue((bool) $settings->get('customer_emails.order_notifications.order_shipped.is_enabled'));
        $this->assertTrue((bool) $settings->get('admin_emails.order_notifications.new_order.is_enabled'));
    }

    /**
     * Scenario "Unknown notification", and the annotations.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_notification_and_annotations(): void
    {
        $errors = $this->errors(UpdateEmailNotificationTool::class, ['recipient' => 'customer', 'group' => 'order_notifications', 'key' => 'order_lost', 'is_enabled' => false]);
        $this->assertStringContainsString('customer/order_notifications/order_shipped', $errors['key'][0]);

        $this->assertTrue(app()->make(FixStorePagesTool::class)->idempotent());
        $this->assertSame(['anthropic/requiresUserInteraction' => true], app()->make(UpdateEmailNotificationTool::class)->meta());
    }
}
