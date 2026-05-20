<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Tests\Support\RestTestCase;

class CountryApiTest extends RestTestCase
{
    public function test_list_countries_returns_results(): void
    {
        $response = $this->request('GET', 'countries');
        $payload = $this->assert_api_success($response);

        $this->assertIsArray($payload['data']);
        $this->assertNotEmpty($payload['data']);
    }

    public function test_show_country_returns_resource(): void
    {
        $response = $this->request('GET', 'countries/US');
        $payload = $this->assert_api_success($response);

        $this->assertEquals('US', $payload['data']['code']);
    }

    public function test_show_unknown_country_returns_404(): void
    {
        $response = $this->request('GET', 'countries/ZZ');
        $this->assert_api_error($response, 404);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'countries');
        $this->assert_api_error($response, 401);
    }
}
