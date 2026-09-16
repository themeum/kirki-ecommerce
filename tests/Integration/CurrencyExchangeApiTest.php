<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Currency\CurrencyExchangeManager;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class CurrencyExchangeApiTest extends RestTestCase
{
    /**
     * Unauthenticated sync request returns 401.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unauthenticated_sync_returns_401(): void
    {
        $this->logout();

        $response = $this->request('POST', 'currency-exchange/sync');
        $this->assert_api_error($response, 401);
    }

    /**
     * Sync without a configured provider returns 400.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sync_without_provider_returns_400(): void
    {
        static::forget_singleton(CurrencyExchangeManager::class);

        $response = $this->request('POST', 'currency-exchange/sync');
        $payload = $this->assert_api_error($response, 400);

        $this->assertArrayHasKey('message', $payload);
    }
}
