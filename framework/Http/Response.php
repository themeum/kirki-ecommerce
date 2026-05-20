<?php

namespace Kirki\Ecommerce\Http;

/**
 * Handles standardized REST API responses for the Ecommerce plugin.
 *
 * @since 1.0.0
 */
class Response
{
    /**
     * HTTP status code for a successful request.
     *
     * @since 1.0.0
     * @var int
     */
    const OK = 200;

    /**
     * HTTP status code for a successfully created resource.
     *
     * @since 1.0.0
     * @var int
     */
    const CREATED = 201;

    /**
     * HTTP status code for a successful request with no content.
     *
     * @since 1.0.0
     * @var int
     */
    const NO_CONTENT = 204;

    /**
     * HTTP status code for a multi-status response.
     *
     * @since 1.0.0
     * @var int
     */
    const MULTI_STATUS = 207;

    /**
     * HTTP status code for a bad request.
     *
     * @since 1.0.0
     * @var int
     */
    const BAD_REQUEST = 400;

    /**
     * HTTP status code for an unauthorized request.
     *
     * @since 1.0.0
     * @var int
     */
    const UNAUTHORIZED = 401;

    /**
     * HTTP status code when authentication is required and has failed or has not yet been provided.
     *
     * @since 1.0.0
     * @var int
     */
    const FORBIDDEN = 403;

    /**
     * HTTP status code when a requested resource is not found.
     *
     * @since 1.0.0
     * @var int
     */
    const NOT_FOUND = 404;

    /**
     * HTTP status code when a request method is not allowed.
     *
     * @since 1.0.0
     * @var int
     */
    const METHOD_NOT_ALLOWED = 405;

    /**
     * HTTP status code when a conflict occurs.
     *
     * @since 1.0.0
     * @var int
     */
    const CONFLICT = 409;

    /**
     * HTTP status code when a request is unprocessable.
     *
     * @since 1.0.0
     * @var int
     */
    const UNPROCESSABLE_ENTITY = 422;

    /**
     * HTTP status code for too many requests (rate limiting).
     *
     * @since 1.0.0
     * @var int
     */
    const TOO_MANY_REQUESTS = 429;

    /**
     * HTTP status code for internal server error.
     *
     * @since 1.0.0
     * @var int
     */
    const INTERNAL_SERVER_ERROR = 500;

    /**
     * HTTP status code for not implemented.
     *
     * @since 1.0.0
     * @var int
     */
    const NOT_IMPLEMENTED = 501;

    /**
     * HTTP status code for service unavailable.
     *
     * @since 1.0.0
     * @var int
     */
    const SERVICE_UNAVAILABLE = 503;


    /**
     * The request headers
     * @var array
     */
    protected $headers = [];

    /**
     * Send a JSON response.
     *
     * @since 1.0.0
     *
     * @param array $data The data to send.
     * @param int $status The HTTP status code.
     * @param array $headers The headers to send.
     * @param int $options The options to use when encoding the data.
     * @return JsonResponse
     */
    public function json($data = [], $status = 200, array $headers = [], int $options = 0)
    {
        return new JsonResponse($data, $status, array_merge($this->headers, $headers), $options);
    }

    /**
     * Set the headers for the response.
     *
     * @since 1.0.0
     *
     * @param array $headers The headers to set.
     * @return $this
     */
    public function with_headers(array $headers)
    {
        $this->headers = $headers;

        return $this;
    }
}
