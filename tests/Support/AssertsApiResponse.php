<?php

namespace Kirki\Ecommerce\Tests\Support;

use WP_REST_Response;

trait AssertsApiResponse
{
    protected function normalize_response_data($data): array
    {
        if (is_object($data)) {
            return json_decode(json_encode($data), true);
        }

        return $data;
    }

    protected function assert_api_success(WP_REST_Response $response, int $expected_status = 200): array
    {
        $this->assertEquals($expected_status, $response->get_status());

        $data = $this->normalize_response_data($response->get_data());
        $this->assertIsArray($data);
        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('message', $data);

        return $data;
    }

    protected function assert_api_error(WP_REST_Response $response, int $expected_status): array
    {
        $this->assertEquals($expected_status, $response->get_status());

        $data = $this->normalize_response_data($response->get_data());
        $this->assertIsArray($data);
        $this->assertArrayHasKey('message', $data);

        return $data;
    }

    protected function assert_validation_error(WP_REST_Response $response): array
    {
        $data = $this->assert_api_error($response, 422);
        $this->assertArrayHasKey('errors', $data);

        return $data;
    }
}
