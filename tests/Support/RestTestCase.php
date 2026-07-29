<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Services\ShippingService;
use WP_UnitTestCase;

use function Kirki\Ecommerce\Framework\migrator;

abstract class RestTestCase extends WP_UnitTestCase
{
    use AssertsApiResponse;
    use RefreshesAppSingletons;

    /**
     * Prepare shared state before the test class runs.
     *
     * @return void
     * @since 1.0.0
     */
    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();
        static::reset_plugin_database();
    }

    /**
     * Prepare state before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->login_as_admin();
    }

    /**
     * Authenticate as an administrator for API requests.
     *
     * @return void
     * @since 1.0.0
     */
    protected function login_as_admin(): void
    {
        $user_id = static::factory()->user->create([
            'role' => 'administrator',
        ]);
        wp_set_current_user($user_id);
    }

    /**
     * Clear the current authenticated user.
     *
     * @return void
     * @since 1.0.0
     */
    protected function logout(): void
    {
        wp_set_current_user(0);
    }

    /**
     * Dispatch a REST request against the plugin API.
     *
     * @param string $method  HTTP method.
     * @param string $path    Route path relative to the API namespace.
     * @param array  $params  Request body or query parameters.
     * @param array  $headers Optional request headers.
     *
     * @return \WP_REST_Response
     * @since 1.0.0
     */
    protected function request(string $method, string $path, array $params = [], array $headers = []): \WP_REST_Response
    {
        return RestRequest::request($method, $path, $params, $headers);
    }

    /**
     * Rebuild plugin tables and reset cached service instances.
     *
     * @return void
     * @since 1.0.0
     */
    protected static function reset_plugin_database(): void
    {
        migrator()->fresh();
        migrator()->run();
        static::forget_singleton(ShippingService::class);
    }
}
