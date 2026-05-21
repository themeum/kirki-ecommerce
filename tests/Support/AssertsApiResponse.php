<?php

namespace Kirki\Ecommerce\Tests\Support;

use WP_REST_Response;

trait AssertsApiResponse
{
    /**
     * Normalize REST response data to an array.
     *
     * @param mixed $data Raw response data.
     *
     * @return array
     * @since 1.0.0
     */
    protected function normalize_response_data($data): array
    {
        if (is_object($data)) {
            return json_decode(json_encode($data), true);
        }

        return $data;
    }

    /**
     * Assert a successful API response shape and status.
     *
     * @param WP_REST_Response $response        REST response instance.
     * @param int              $expected_status Expected HTTP status code.
     *
     * @return array
     * @since 1.0.0
     */
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

    /**
     * Assert an API error response shape and status.
     *
     * @param WP_REST_Response $response        REST response instance.
     * @param int              $expected_status Expected HTTP status code.
     *
     * @return array
     * @since 1.0.0
     */
    protected function assert_api_error(WP_REST_Response $response, int $expected_status): array
    {
        $this->assertEquals($expected_status, $response->get_status());

        $data = $this->normalize_response_data($response->get_data());
        $this->assertIsArray($data);
        $this->assertArrayHasKey('message', $data);

        return $data;
    }

    /**
     * Assert a validation error response with field errors.
     *
     * @param WP_REST_Response $response REST response instance.
     *
     * @return array
     * @since 1.0.0
     */
    protected function assert_validation_error(WP_REST_Response $response): array
    {
        $data = $this->assert_api_error($response, 422);
        $this->assertArrayHasKey('errors', $data);

        return $data;
    }
}
