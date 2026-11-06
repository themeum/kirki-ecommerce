<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Supports\Facades\Http;

use function Kirki\Ecommerce\Framework\throw_anyway;

defined('ABSPATH') || exit;

/**
 * Thin client for the SSLCommerz API, version 4.
 *
 * The API takes the store password in the URL of each GET call, so no message from this class
 * holds a URL or a query string.
 */
class SslcommerzClient
{
    /** @var string */
    protected string $store_id;

    /** @var string */
    protected string $store_password;

    /** @var bool */
    protected bool $sandbox;

    /**
     * @param string $store_id       The SSLCommerz Store ID.
     * @param string $store_password The SSLCommerz Store Password.
     * @param bool   $sandbox        Whether to use the sandbox host.
     */
    public function __construct(string $store_id, string $store_password, bool $sandbox)
    {
        $this->store_id = $store_id;
        $this->store_password = $store_password;
        $this->sandbox = $sandbox;
    }

    /**
     * Create a hosted payment session.
     *
     * @param array<string, mixed> $payload The payload from SslcommerzTransactionBuilder.
     * @return array<string, mixed>
     * @throws SslcommerzRejectedException      If SSLCommerz refuses the session.
     * @throws SslcommerzUnknownResultException If the request has no clear result.
     */
    public function create_session(array $payload): array
    {
        $response = Http::as_form()
            ->timeout(SslcommerzConstant::TIMEOUT_SECONDS)
            ->post($this->base_url() . SslcommerzConstant::SESSION_PATH, array_merge($payload, $this->credentials()));

        $body = $this->decode($response);

        if (($body['status'] ?? '') !== SslcommerzConstant::SESSION_SUCCESS) {
            throw_anyway($this->error_message($body), SslcommerzRejectedException::class);
        }

        return $body;
    }

    /**
     * Get the Order Validation API result for a validation ID.
     *
     * @param string $val_id The validation ID.
     * @return array<string, mixed>
     * @throws SslcommerzRejectedException      If SSLCommerz refuses the request.
     * @throws SslcommerzUnknownResultException If the request has no clear result.
     */
    public function validate(string $val_id): array
    {
        return $this->get(SslcommerzConstant::VALIDATION_PATH, ['val_id' => $val_id, 'format' => 'json', 'v' => 1]);
    }

    /**
     * Get all payment attempts of a transaction ID.
     *
     * A query is clear only when it has APIConnect set to DONE.
     *
     * @param string $tran_id The transaction ID.
     * @return array<int, array<string, mixed>> The elements of the response.
     * @throws SslcommerzRejectedException      If SSLCommerz refuses the request.
     * @throws SslcommerzUnknownResultException If the request has no clear result.
     */
    public function query_by_tran_id(string $tran_id): array
    {
        $body = $this->get(SslcommerzConstant::TRANSACTION_PATH, ['tran_id' => $tran_id, 'format' => 'json']);

        if (($body['APIConnect'] ?? '') !== SslcommerzConstant::API_CONNECT_DONE) {
            throw $this->unknown_result();
        }

        return array_values(array_filter((array) ($body['element'] ?? []), 'is_array'));
    }

    /**
     * Start a refund.
     *
     * @param array<string, mixed> $payload The bank_tran_id, refund_trans_id, refund_amount and refund_remarks.
     * @return array<string, mixed>
     * @throws SslcommerzRejectedException      If SSLCommerz refuses the request.
     * @throws SslcommerzUnknownResultException If the request has no clear result.
     */
    public function refund(array $payload): array
    {
        return $this->get(SslcommerzConstant::TRANSACTION_PATH, array_merge($payload, ['format' => 'json']));
    }

    /**
     * Get the state of a refund.
     *
     * @param string $refund_ref_id The SSLCommerz refund reference.
     * @return array<string, mixed>
     * @throws SslcommerzRejectedException      If SSLCommerz refuses the request.
     * @throws SslcommerzUnknownResultException If the request has no clear result.
     */
    public function query_refund(string $refund_ref_id): array
    {
        return $this->get(SslcommerzConstant::TRANSACTION_PATH, ['refund_ref_id' => $refund_ref_id, 'format' => 'json']);
    }

    /**
     * Determine whether a posted message has a correct verify_sign.
     *
     * @param array<string, mixed> $data The raw posted values.
     * @return bool
     */
    public function has_valid_signature(array $data): bool
    {
        $signature = $data['verify_sign'] ?? '';
        $key_names = $data['verify_key'] ?? '';

        if (!is_string($signature) || !is_string($key_names) || $signature === '' || $key_names === '') {
            return false;
        }

        $fields = ['store_passwd' => md5($this->store_password)];

        foreach (explode(',', $key_names) as $name) {
            if (array_key_exists($name, $data) && is_scalar($data[$name])) {
                $fields[$name] = (string) $data[$name];
            }
        }

        ksort($fields);

        $parts = [];

        foreach ($fields as $name => $value) {
            $parts[] = $name . '=' . $value;
        }

        return hash_equals(md5(implode('&', $parts)), $signature);
    }

    /**
     * Send a GET request with the store credentials.
     *
     * @param string               $path  The endpoint path.
     * @param array<string, mixed> $query The query fields.
     * @return array<string, mixed>
     * @throws SslcommerzRejectedException      If SSLCommerz refuses the request.
     * @throws SslcommerzUnknownResultException If the request has no clear result.
     */
    protected function get(string $path, array $query): array
    {
        $response = Http::timeout(SslcommerzConstant::TIMEOUT_SECONDS)
            ->get($this->base_url() . $path, array_merge($query, $this->credentials()));

        $body = $this->decode($response);

        if (isset($body['APIConnect']) && $body['APIConnect'] !== SslcommerzConstant::API_CONNECT_DONE) {
            throw_anyway($this->error_message($body), SslcommerzRejectedException::class);
        }

        return $body;
    }

    /**
     * Get the decoded body of a response.
     *
     * @param mixed $response The HTTP response.
     * @return array<string, mixed>
     * @throws SslcommerzUnknownResultException If the response has no clear result.
     */
    protected function decode($response): array
    {
        $body = $response->json();

        if ($response->status() !== 200 || !is_array($body)) {
            throw $this->unknown_result();
        }

        return $body;
    }

    /**
     * Get the store credentials as request fields.
     *
     * @return array<string, string>
     */
    protected function credentials(): array
    {
        return ['store_id' => $this->store_id, 'store_passwd' => $this->store_password];
    }

    /**
     * Get the base URL for this environment.
     *
     * @return string
     */
    protected function base_url(): string
    {
        return $this->sandbox ? SslcommerzConstant::SANDBOX_BASE_URL : SslcommerzConstant::LIVE_BASE_URL;
    }

    /**
     * Get the error message from an SSLCommerz response.
     *
     * @param array<string, mixed> $body The decoded response body.
     * @return string
     */
    protected function error_message(array $body): string
    {
        foreach (['failedreason', 'errorReason', 'error', 'APIConnect'] as $field) {
            if (!empty($body[$field]) && is_string($body[$field])) {
                return $body[$field];
            }
        }

        return __('SSLCommerz refused the request.', 'kirki-ecommerce-sslcommerz');
    }

    /**
     * Create the exception for a request with no clear result.
     *
     * @return SslcommerzUnknownResultException
     */
    protected function unknown_result(): SslcommerzUnknownResultException
    {
        return new SslcommerzUnknownResultException(__('SSLCommerz did not give a clear result.', 'kirki-ecommerce-sslcommerz'));
    }
}
