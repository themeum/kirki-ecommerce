<?php

namespace Kirki\Ecommerce\Contracts;

/**
 * Contract for sending structured JSON responses.
 *
 * Implementations should return a WordPress-compatible REST response.
 *
 * @since 1.0.0
 */
interface Response
{
    /**
     * Return a JSON-formatted REST response.
     *
     * @since 1.0.0
     *
     * @param array $data The response data.
     * @param int   $code Optional. HTTP status code. Default Response::OK.
     * @return static
     */
    public function json(array $data, int $code = 200);

    /**
     * Return a text-formatted REST response.
     *
     * @since 1.0.0
     *
     * @param string $data The response data.
     * @param int    $code Optional. HTTP status code. Default Response::OK.
     * @return static
     */
    public function text(string $data, int $code = 200);
}
