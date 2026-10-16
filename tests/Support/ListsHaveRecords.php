<?php

namespace Kirki\Ecommerce\Tests\Support;

/**
 * Reads the record presence flag from a list endpoint.
 *
 * @since 1.0.0
 */
trait ListsHaveRecords
{
    /**
     * Request a list endpoint and return its has_records flag.
     *
     * @since 1.0.0
     *
     * @param string               $route  List endpoint route.
     * @param array<string, mixed> $params Extra query parameters.
     * @return bool
     */
    protected function list_has_records(string $route, array $params = []): bool
    {
        $response = $this->request('GET', $route, array_merge(['page' => 1, 'limit' => 10], $params));
        $payload = $this->assert_api_success($response);

        $this->assertArrayHasKey('has_records', $payload['data']);

        return $payload['data']['has_records'];
    }
}
