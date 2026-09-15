<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Framework\Facade;
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
     * Clean up state after each test.
     *
     * Clears the Facade's process-wide static instance cache so a facade
     * resolved here against real WP-backed data (e.g. Settings) can't leak
     * into a later test in the same PHPUnit run that expects its own
     * container binding to be resolved fresh.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        $this->reset_facade_cache();

        parent::tearDown();
    }

    /**
     * Reset the Facade base class's static resolved-instance cache.
     *
     * @return void
     * @since 1.0.0
     */
    protected function reset_facade_cache(): void
    {
        $reflection = new \ReflectionClass(Facade::class);
        $property = $reflection->getProperty('resolved_instance');
        $property->setAccessible(true);
        $property->setValue(null, []);
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
