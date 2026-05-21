<?php

namespace Kirki\Ecommerce\Tests\Support;

trait SeedsTestCurrency
{
    /**
     * Ensure a base currency exists for tests.
     *
     * @return void
     * @since 1.0.0
     */
    protected function seed_base_currency(): void
    {
        $existing = $this->request('GET', 'currencies', ['limit' => 1]);
        $payload = $this->assert_api_success($existing);

        if (!empty($payload['data']['results'])) {
            return;
        }

        $this->request('POST', 'currencies', [
            'items' => [
                [
                    'code' => 'USD',
                    'name' => 'US Dollar',
                    'symbol' => '$',
                    'exchange_rate' => 1.0,
                    'is_base' => true,
                    'is_active' => true,
                ],
            ],
        ]);
    }

    /**
     * Return the base currency identifier.
     *
     * @return int
     * @since 1.0.0
     */
    protected function base_currency_id(): int
    {
        $this->seed_base_currency();

        $listed = $this->request('GET', 'currencies', ['limit' => 1]);
        $payload = $this->assert_api_success($listed);

        return (int) $payload['data']['results'][0]['id'];
    }
}
