<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Http\Client\Request as HttpRequest;
use Kirki\Ecommerce\Framework\Http\Client\Response as HttpResponse;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Eway Rapid API.
 */
class EwayClient
{
    protected string $api_key;
    protected string $api_password;
    protected bool $sandbox;

    /**
     * @param string $api_key      Eway API key.
     * @param string $api_password Eway API password.
     * @param bool   $sandbox      Whether to use the sandbox API endpoints.
     *
     * @throws InvalidArgumentException If either credential is empty.
     */
    public function __construct(string $api_key, string $api_password, bool $sandbox = false)
    {
        if (empty($api_key) || empty($api_password)) {
            throw new InvalidArgumentException(__('Eway credentials are missing.', 'kirki-ecommerce-eway'));
        }

        $this->api_key = $api_key;
        $this->api_password = $api_password;
        $this->sandbox = $sandbox;
    }

    /**
     * Create an access code for Eway's Responsive Shared Page.
     *
     * @param array $payload
     * @return array
     * @throws Exception If the request fails.
     */
    public function create_shared_access_code(array $payload): array
    {
        return $this->decode(
            $this->request()->as_json()->post($this->url(EwayConstant::PATH_ACCESS_CODES_SHARED), $payload)
        );
    }

    /**
     * Fetch the transaction result for an access code.
     *
     * @param string $access_code
     * @return array
     * @throws Exception If the request fails.
     */
    public function get_transaction(string $access_code): array
    {
        return $this->decode(
            $this->request()->get($this->url(EwayConstant::PATH_TRANSACTION . rawurlencode($access_code)))
        );
    }

    /**
     * Build a pre-configured HTTP request for the Eway Rapid API.
     *
     * @return HttpRequest
     */
    protected function request(): HttpRequest
    {
        return Http::with_token(base64_encode($this->api_key . ':' . $this->api_password), 'Basic')
            ->with_headers(['X-EWAY-APIVERSION' => EwayConstant::API_VERSION])
            ->with_user_agent('KirkiEcommerce/1.0');
    }

    /**
     * Resolve a Rapid endpoint path against the active environment.
     *
     * @param string $path The endpoint path.
     * @return string The absolute request URL.
     */
    protected function url(string $path): string
    {
        return ($this->sandbox ? EwayConstant::BASE_URL_SANDBOX : EwayConstant::BASE_URL_PRODUCTION) . $path;
    }

    /**
     * @throws Exception If the response is an HTTP error or not a JSON object.
     */
    protected function decode(HttpResponse $response): array
    {
        $data = $response->json();

        if ($response->failed() || !is_array($data)) {
            throw new Exception($response->body());
        }

        return $data;
    }
}
