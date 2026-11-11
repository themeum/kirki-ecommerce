<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Supports\Facades\Cache;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

use function Kirki\Ecommerce\Framework\throw_anyway;

defined('ABSPATH') || exit;

/**
 * Thin client for the bKash Tokenized Checkout API, version 2.
 */
class BkashClient
{
    /** @var string */
    protected string $app_key;

    /** @var string */
    protected string $app_secret;

    /** @var string */
    protected string $username;

    /** @var string */
    protected string $password;

    /** @var bool */
    protected bool $sandbox;

    /**
     * @param string $app_key    The bKash App Key.
     * @param string $app_secret The bKash App Secret.
     * @param string $username   The bKash API username.
     * @param string $password   The bKash API password.
     * @param bool   $sandbox    Whether to use the sandbox host.
     */
    public function __construct(string $app_key, string $app_secret, string $username, string $password, bool $sandbox)
    {
        $this->app_key = $app_key;
        $this->app_secret = $app_secret;
        $this->username = $username;
        $this->password = $password;
        $this->sandbox = $sandbox;
    }

    /**
     * Create a payment.
     *
     * @param array<string, string> $payload The payload from BkashTransactionBuilder.
     * @return array<string, mixed>
     * @throws BkashRejectedException      If bKash refuses the request.
     * @throws BkashUnknownResultException If the request has no clear result.
     */
    public function create_payment(array $payload): array
    {
        return $this->post(BkashConstant::CREATE_PAYMENT_PATH, $payload);
    }

    /**
     * Execute a payment that the customer approved.
     *
     * @param string $payment_id The bKash payment ID.
     * @return array<string, mixed>
     * @throws BkashRejectedException      If bKash refuses the request.
     * @throws BkashUnknownResultException If the request has no clear result.
     */
    public function execute_payment(string $payment_id): array
    {
        return $this->post(BkashConstant::EXECUTE_PAYMENT_PATH, ['paymentId' => $payment_id]);
    }

    /**
     * Get the current state of a payment.
     *
     * @param string $payment_id The bKash payment ID.
     * @return array<string, mixed>
     * @throws BkashRejectedException      If bKash refuses the request.
     * @throws BkashUnknownResultException If the request has no clear result.
     */
    public function query_payment(string $payment_id): array
    {
        return $this->post(BkashConstant::QUERY_PAYMENT_PATH, ['paymentId' => $payment_id]);
    }

    /**
     * Refund a completed payment.
     *
     * @param array<string, string> $payload The paymentId, trxId, refundAmount, sku and reason.
     * @return array<string, mixed>
     * @throws BkashRejectedException      If bKash refuses the request.
     * @throws BkashUnknownResultException If the request has no clear result.
     */
    public function refund(array $payload): array
    {
        return $this->post(BkashConstant::REFUND_PATH, $payload);
    }

    /**
     * Get the refunds of a payment.
     *
     * @param string $payment_id The bKash payment ID.
     * @param string $trx_id     The transaction ID of the original payment.
     * @return array<string, mixed>
     * @throws BkashRejectedException      If bKash refuses the request.
     * @throws BkashUnknownResultException If the request has no clear result.
     */
    public function refund_status(string $payment_id, string $trx_id): array
    {
        return $this->post(BkashConstant::REFUND_STATUS_PATH, ['paymentId' => $payment_id, 'trxId' => $trx_id]);
    }

    /**
     * Send an authorized request to bKash.
     *
     * @param string               $path    The endpoint path.
     * @param array<string, mixed> $payload The request body.
     * @return array<string, mixed>
     * @throws BkashRejectedException      If bKash refuses the request.
     * @throws BkashUnknownResultException If the request has no clear result.
     */
    protected function post(string $path, array $payload): array
    {
        $token = $this->get_token();

        $response = Http::with_headers(['authorization' => $token, 'X-App-Key' => $this->app_key])
            ->timeout(BkashConstant::TIMEOUT_SECONDS)
            ->as_json()
            ->post($this->base_url() . $path, $payload);

        $body = $response->json();

        if ($response->status() >= 500) {
            throw $this->unknown_result();
        }

        if (is_array($body) && !empty($body['externalCode'])) {
            throw_anyway($this->error_message($body), BkashRejectedException::class, (string) $body['externalCode']);
        }

        if ($response->failed() || !is_array($body)) {
            throw $this->unknown_result();
        }

        return $body;
    }

    /**
     * Get a usable token, and renew it when it is due.
     *
     * Only one request renews at a time. Any other request continues with the current
     * token while it is still valid, because the framework lock does not wait and a
     * token stays valid after its refresh time.
     *
     * @return string
     * @throws Exception If no usable token exists and the renewal fails or is already running.
     */
    protected function get_token(): string
    {
        $stored = Cache::get($this->token_key());

        if ($this->is_younger_than($stored, BkashConstant::TOKEN_REFRESH_AFTER_SECONDS)) {
            return $stored['id_token'];
        }

        $failure = null;

        try {
            $renewed = Cache::lock($this->token_key() . '_lock', BkashConstant::TOKEN_LOCK_SECONDS)->get(function () {
                return $this->renew_token();
            });

            if (is_array($renewed)) {
                return $renewed['id_token'];
            }
        } catch (Exception $e) {
            $failure = $e;
        }

        if ($this->is_younger_than($stored, BkashConstant::TOKEN_LIFETIME_SECONDS)) {
            return $stored['id_token'];
        }

        throw $failure ?? $this->unknown_result();
    }

    /**
     * Renew and store the token. The caller must hold the token lock.
     *
     * @return array<string, mixed> The stored token record.
     * @throws BkashRejectedException      If bKash refuses the renewal.
     * @throws BkashUnknownResultException If the renewal has no clear result.
     */
    protected function renew_token(): array
    {
        $stored = Cache::get($this->token_key());

        if ($this->is_younger_than($stored, BkashConstant::TOKEN_REFRESH_AFTER_SECONDS)) {
            return $stored;
        }

        $tokens = null;

        if (!empty($stored['refresh_token'])) {
            try {
                $tokens = $this->request_token(BkashConstant::REFRESH_TOKEN_PATH, ['refresh_token' => $stored['refresh_token']]);
            } catch (BkashRejectedException $e) {
                $tokens = null;
            }
        }

        $tokens = $tokens ?? $this->request_token(BkashConstant::GRANT_TOKEN_PATH);

        $record = [
            'id_token' => $tokens['id_token'],
            'refresh_token' => $tokens['refresh_token'] ?? '',
            'issued_at' => time(),
        ];

        Cache::put($this->token_key(), $record, BkashConstant::REFRESH_TOKEN_LIFETIME_SECONDS);

        return $record;
    }

    /**
     * Call a bKash token endpoint.
     *
     * @param string               $path  The endpoint path.
     * @param array<string, mixed> $extra Extra body fields.
     * @return array<string, mixed>
     * @throws BkashRejectedException      If bKash refuses the request.
     * @throws BkashUnknownResultException If the request has no clear result.
     */
    protected function request_token(string $path, array $extra = []): array
    {
        $response = Http::with_headers(['username' => $this->username, 'password' => $this->password])
            ->timeout(BkashConstant::TIMEOUT_SECONDS)
            ->as_json()
            ->post($this->base_url() . $path, array_merge(['app_key' => $this->app_key, 'app_secret' => $this->app_secret], $extra));

        $body = $response->json();

        if ($response->status() >= 500 || !is_array($body)) {
            throw $this->unknown_result();
        }

        if (empty($body['id_token'])) {
            throw_anyway($this->error_message($body), BkashRejectedException::class, (string) ($body['externalCode'] ?? $body['statusCode'] ?? ''));
        }

        return $body;
    }

    /**
     * Determine whether a stored token record is younger than an age.
     *
     * @param mixed $stored  The stored token record.
     * @param int   $seconds The age in seconds.
     * @return bool
     */
    protected function is_younger_than($stored, int $seconds): bool
    {
        return is_array($stored) && !empty($stored['id_token']) && (time() - (int) ($stored['issued_at'] ?? 0)) < $seconds;
    }

    /**
     * Get the cache key of the token for this environment and App Key.
     *
     * @return string
     */
    protected function token_key(): string
    {
        return 'bkash_token_' . md5(($this->sandbox ? 'sandbox' : 'live') . '|' . $this->app_key);
    }

    /**
     * Get the base URL for this environment.
     *
     * @return string
     */
    protected function base_url(): string
    {
        return $this->sandbox ? BkashConstant::SANDBOX_BASE_URL : BkashConstant::LIVE_BASE_URL;
    }

    /**
     * Get the error message from a bKash error body.
     *
     * @param array<string, mixed> $body The decoded response body.
     * @return string
     */
    protected function error_message(array $body): string
    {
        return (string) ($body['errorMessageEn'] ?? $body['statusMessage'] ?? __('bKash refused the request.', 'kirki-ecommerce-bkash'));
    }

    /**
     * Create the exception for a request with no clear result.
     *
     * @return BkashUnknownResultException
     */
    protected function unknown_result(): BkashUnknownResultException
    {
        return new BkashUnknownResultException(__('bKash did not give a clear result.', 'kirki-ecommerce-bkash'));
    }
}
