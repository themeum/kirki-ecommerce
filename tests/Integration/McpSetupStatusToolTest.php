<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Mcp\Tools\SetupStatusTool;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Services\SetupChecklistService;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 6.6: the setup-status MCP tool.
 *
 * Spec: mcp-setup-status.
 */
class McpSetupStatusToolTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Start every test from a new store: no products, no payment method, no tax regions and no shipping zones.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        Product::query()->delete();
        Option::delete(OptionKeys::SETUP_CHECKLIST);
        Option::delete('paypal');
        $this->set_settings(OptionKeys::GENERAL_SETTINGS, ['is_tax_calculation_enabled' => true]);
        $this->set_settings(OptionKeys::TAX_SETTINGS, ['tax_regions' => []]);
        $this->set_settings(OptionKeys::SHIPPING_SETTINGS, ['shipping_zones' => []]);
        $this->set_settings(OptionKeys::PAYMENT_SETTINGS, ['offline_payments' => []]);
    }

    /**
     * Merge values into a settings option and rebuild the caches that read it.
     *
     * @param string $key    Option key.
     * @param array  $values Values to merge.
     *
     * @return void
     * @since 1.0.0
     */
    protected function set_settings(string $key, array $values): void
    {
        $current = Option::get($key);
        Option::set($key, array_merge(is_array($current) ? $current : [], $values));

        $this->reset_facade_cache();
        $this->reset_settings_factory_cache();
        $this->reset_option_manager_cache();
        app()->instance(PaymentManager::class, new PaymentManager());
    }

    /**
     * Run the tool and get its structured content.
     *
     * @return array
     * @since 1.0.0
     */
    protected function call(): array
    {
        $response = app()->make(SetupStatusTool::class)->handle(new Request([]));

        $this->assertSame('structured', $response->kind());

        return $response->content();
    }

    /**
     * Scenario "New store": products and payments are not completed, and all steps completed is false.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_new_store(): void
    {
        $result = $this->call();
        $steps = array_column($result['steps'], null, 'id');

        $this->assertSame(['products', 'payments', 'tax', 'shipping'], array_column($result['steps'], 'id'));
        $this->assertFalse($steps['products']['is_completed']);
        $this->assertFalse($steps['payments']['is_completed']);
        $this->assertFalse($result['all_completed']);
        $this->assertStringEndsWith('admin.php?page=kirki-ecommerce#/settings/payments', $steps['payments']['admin_page']);
        $this->assertStringEndsWith('admin.php?page=kirki-ecommerce#/products/create', $steps['products']['admin_page']);
    }

    /**
     * Scenario "Same state as the Home page": after a product is added, the products step is completed in the tool and in the checklist.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_products_step_is_completed_after_a_product_is_added(): void
    {
        $this->create_product();

        $steps = array_column($this->call()['steps'], null, 'id');
        $home = array_column(app()->make(SetupChecklistService::class)->get_state(), null, 'id');

        $this->assertTrue($steps['products']['is_completed']);
        $this->assertSame($home['products']['is_completed'], $steps['products']['is_completed']);
        $this->assertSame(array_column($home, 'is_completed', 'id'), array_column($steps, 'is_completed', 'id'));
    }
}
