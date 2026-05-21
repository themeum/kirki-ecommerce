<?php

namespace Kirki\Ecommerce\Tests\Support;

use WP_REST_Request;
use WP_REST_Response;

class RestRequest
{
    /**
     * REST API namespace for plugin routes.
     *
     * @since 1.0.0
     */
    public const API_NAMESPACE = 'kirki/ecommerce/v1';

    /**
     * Dispatch a REST request against the plugin API.
     *
     * @param string $method  HTTP method.
     * @param string $path    Route path relative to the API namespace.
     * @param array  $params  Request body or query parameters.
     * @param array  $headers Optional request headers.
     *
     * @return WP_REST_Response
     * @since 1.0.0
     */
    public static function request(string $method, string $path, array $params = [], array $headers = []): WP_REST_Response
    {
        $route = '/' . static::API_NAMESPACE . '/' . ltrim($path, '/');
        $request = new WP_REST_Request(strtoupper($method), $route);

        foreach ($headers as $name => $value) {
            $request->set_header($name, $value);
        }

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
