<?php

namespace Kirki\Ecommerce\Tests\Support;

use WP_REST_Request;
use WP_REST_Response;

class RestRequest
{
    public const API_NAMESPACE = 'kirki/ecommerce/v1';

    public static function request(string $method, string $path, array $params = []): WP_REST_Response
    {
        $route = '/' . self::API_NAMESPACE . '/' . ltrim($path, '/');
        $request = new WP_REST_Request(strtoupper($method), $route);

        if (!empty($params)) {
            if (in_array(strtoupper($method), ['POST', 'PUT', 'PATCH'], true)) {
                $request->set_body_params($params);
            } else {
                $request->set_query_params($params);
            }
        }

        return rest_do_request($request);
    }
}
