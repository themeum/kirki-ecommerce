<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the QuickPay Payments API.
 */
class TwocheckoutClient
{
    protected string $merchant_code;
    protected string $secret_key;
    protected string $buy_link_secret_word;
    protected bool $sandbox;

    /**
     * @param string $merchant_code QuickPay API merchant_code.
     * @param string $secret_key QuickPay API secret_key.
     * @param bool $sandbox Whether to use the sandbox API endpoints.
     */
    public function __construct(string $merchant_code, string $secret_key, string $buy_link_secret_word, bool $sandbox = false)
    {
        $this->merchant_code = $merchant_code;
        $this->secret_key = $secret_key;
        $this->buy_link_secret_word = $buy_link_secret_word;
        $this->sandbox = $sandbox;
    }

    /**
     * Verify a webhook payload against QuickPay's HMAC-SHA256 checksum header.
     *
     * @param string $raw_payload The raw webhook request body.
     * @return bool
     */
    public function is_verified(string $raw_payload): bool
    {
        $given_checksum = $_SERVER['HTTP_QUICKPAY_CHECKSUM_SHA256'] ?? '';

        if (empty($raw_payload)  || empty($given_checksum)) {
            return false;
        }

        $expected_checksum = hash_hmac('sha256', $raw_payload, $this->private_key);

        return hash_equals($expected_checksum, $given_checksum);
    }


    /**
     * Send a request to the 2Checkout API and decode the JSON response.
     *
     */
    protected function send(string $method, string $url, array $payload = [], array $headers = []): array
    {
        $request = Http::as_json();

        if (!empty($headers)) {
            $request = $request->with_headers($headers);
        }

        if (TwocheckoutConstant::METHOD_GET !== $method) {
            $request = $request->with_body(wp_json_encode($payload, JSON_UNESCAPED_UNICODE));
        }

        $response = $request->{$method}($url);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }


    /**
     * Whether the gateway is running against 2Checkout's sandbox environment.
     * @return bool
     */
    public function is_sandbox(): bool
    {
        return $this->sandbox;
    }

    public function generate_signature(array $payload)
    {
        $token = $this->generate_token();
        try {
            $signature = $this->send(TwocheckoutConstant::METHOD_POST, TwocheckoutConstant::SIGNATURE_GENERATE_URL, $payload, ['merchant-token' => $token]);
        } catch (\Throwable $th) {
            throw new Exception(esc_html__('Error While Creating Signature: ', 'kirki-ecommerce-2checkout'), $th->getMessage());
        }
        return $signature['signature'];
    }

    protected function generate_token()
    {
        $header = array(
            'alg' => TwocheckoutConstant::ALGO,
            'typ' => TwocheckoutConstant::TOKEN_TYPE
        );

        $claims = array(
            'sub' => $this->merchant_code,
            'iat' => time(),
            'exp' => time() + TwocheckoutConstant::JWT_EXPIRE_TIME,
        );

        $encoded_string = $this->encode_string($header) . '.' . $this->encode_string($claims);
        $signature      = $this->base64_url_encode(
            hash_hmac(
                TwocheckoutConstant::HASH_ALGORITHM,
                $encoded_string,
                $this->buy_link_secret_word,
                true
            )
        );
        $token = $this->encode_string($header) . '.' . $this->encode_string($claims) . '.' . $signature;

        return $token;
    }

    protected function encode_string($data)
    {
        if (empty($data)) {
            throw new Exception(esc_html__('Invalid Data.', 'kirki-ecommerce-2checkout'));
        }

        return $this->base64_url_encode(wp_json_encode($data));
    }

    protected function base64_url_encode($data)
    {
        if (empty($data)) {
            throw new Exception(esc_html__('Invalid Data.', 'kirki-ecommerce-2checkout'));
        }

        $base64 = base64_encode($data);
        return str_replace(array('+', '/', '='), array('-', '_', ''), $base64);
    }
}
