<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class AdminApiAccessTest extends RestTestCase
{
    /**
     * Representative store management endpoints, one or more per area.
     *
     * @return array
     * @since 1.0.0
     */
    public function admin_endpoints(): array
    {
        return [
            'list orders' => ['GET', 'orders'],
            'create order' => ['POST', 'orders'],
            'create refund' => ['POST', 'orders/1/refunds'],
            'list customers' => ['GET', 'customers'],
            'update settings' => ['PUT', 'settings'],
            'install payment add-on' => ['POST', 'online-payments/install'],
            'create product' => ['POST', 'products'],
            'app config' => ['GET', 'app-config'],
            'setup checklist' => ['GET', 'setup-checklist'],
            'complete setup step' => ['POST', 'setup-checklist/tax/complete'],
            'dashboard overview' => ['GET', 'dashboard/overview'],
        ];
    }

    /**
     * A logged-in customer without manage_options is forbidden from store management endpoints.
     *
     * @dataProvider admin_endpoints
     *
     * @param string $method HTTP method.
     * @param string $path   Route path.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customer_is_forbidden_from_admin_endpoint(string $method, string $path): void
    {
        wp_set_current_user(static::factory()->user->create(['role' => 'subscriber']));

        $this->assert_api_error($this->request($method, $path), 403);
    }

    /**
     * A logged-in staff user with other capabilities but not manage_options is forbidden too.
     *
     * @dataProvider admin_endpoints
     *
     * @param string $method HTTP method.
     * @param string $path   Route path.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_editor_is_forbidden_from_admin_endpoint(string $method, string $path): void
    {
        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));

        $this->assert_api_error($this->request($method, $path), 403);
    }

    /**
     * A visitor who is not logged in gets 401, not 403, from store management endpoints.
     *
     * @dataProvider admin_endpoints
     *
     * @param string $method HTTP method.
     * @param string $path   Route path.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_visitor_is_unauthorized_on_admin_endpoint(string $method, string $path): void
    {
        $this->logout();

        $this->assert_api_error($this->request($method, $path), 401);
    }

    /**
     * An administrator can still use store management endpoints.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_administrator_can_use_admin_endpoints(): void
    {
        $this->assert_api_success($this->request('GET', 'orders'));
        $this->assert_api_success($this->request('GET', 'customers'));
    }

    /**
     * A logged-in customer keeps access to their own account endpoints.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customer_can_use_account_endpoints(): void
    {
        wp_set_current_user(static::factory()->user->create(['role' => 'subscriber']));

        $this->assert_api_success($this->request('GET', 'account/orders'));
        $this->assert_api_success($this->request('GET', 'account/addresses'));
    }

    /**
     * A visitor cannot use account endpoints but can still shop.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_visitor_can_shop_but_not_use_account_endpoints(): void
    {
        $this->logout();

        $this->assert_api_error($this->request('GET', 'account/addresses'), 401);
        $this->assert_api_success($this->request('GET', 'cart'));
        $this->assert_api_success($this->request('GET', 'shop/products'));
    }

    /**
     * Being a store admin follows the manage_options capability, not the administrator role.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_store_admin_follows_manage_options_not_role(): void
    {
        $administrator_id = static::factory()->user->create(['role' => 'administrator']);
        get_userdata($administrator_id)->add_cap('manage_options', false);

        $editor_id = static::factory()->user->create(['role' => 'editor']);
        get_userdata($editor_id)->add_cap('manage_options');

        $this->assertFalse((new User($administrator_id))->is_admin());
        $this->assertTrue((new User($editor_id))->is_admin());
    }

    /**
     * The removed debug endpoints do not exist for anyone.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_debug_endpoints_are_removed(): void
    {
        $this->assert_api_error($this->request('GET', 'test'), 404);
        $this->assert_api_error($this->request('GET', 'test-public'), 404);

        $this->logout();

        $this->assert_api_error($this->request('GET', 'test'), 404);
        $this->assert_api_error($this->request('GET', 'test-public'), 404);
    }
}
