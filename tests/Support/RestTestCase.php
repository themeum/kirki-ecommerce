<?php

namespace Kirki\Ecommerce\Tests\Support;

use WP_UnitTestCase;

use function Kirki\Ecommerce\migrator;

abstract class RestTestCase extends WP_UnitTestCase
{
    use AssertsApiResponse;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();
        self::reset_plugin_database();
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->login_as_admin();
    }

    protected function login_as_admin(): void
    {
        $user_id = self::factory()->user->create([
            'role' => 'administrator',
        ]);
        wp_set_current_user($user_id);
    }

    protected function logout(): void
    {
        wp_set_current_user(0);
    }

    protected function request(string $method, string $path, array $params = []): \WP_REST_Response
    {
        return RestRequest::request($method, $path, $params);
    }

    protected static function reset_plugin_database(): void
    {
        migrator()->fresh();
        migrator()->run();
    }
}
