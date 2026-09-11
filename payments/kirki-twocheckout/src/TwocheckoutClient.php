<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the 2Checkout (Verifone) API.
 */
class TwocheckoutClient
{
    protected string $merchant_code;
    protected string $secret_key;
    protected string $buy_link_secret_word;
    protected bool $sandbox;

    /**
     * @param string $merchant_code 2Checkout merchant code.
     * @param string $secret_key 2Checkout API secret key.
     * @param string $buy_link_secret_word 2Checkout buy-link secret word.
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

    /**
     * Request a buy-link signature from 2Checkout for the given payload.
     *
     * @param array $payload The buy-link parameters to sign.
     *
     * @return string The signature to append to the buy-link URL.
     *
     * @throws Exception If the signature request fails.
     */
    public function generate_signature(array $payload)
    {
        $token = $this->generate_token();
        try {
            $signature = $this->send(TwocheckoutConstant::METHOD_POST, TwocheckoutConstant::SIGNATURE_GENERATE_URL, $payload, ['merchant-token' => $token]);
        } catch (\Throwable $th) {
            /* translators: %s: error message */
            throw new Exception(sprintf(esc_html__('Error while creating signature: %s', 'kirki-ecommerce-twocheckout'), $th->getMessage()));
        }
        return $signature['signature'];
    }

    /**
     * Build the JWT used to authenticate against the signature endpoint.
     *
     * @return string The encoded JWT.
     *
     * @throws Exception If the header or claims cannot be encoded.
     */
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

    /**
     * JSON-encode a value and return it in base64url form.
     *
     * @param array|string $data The data to encode.
     *
     * @return string
     *
     * @throws Exception If the data is empty.
     */
    protected function encode_string($data)
    {
        if (empty($data)) {
            throw new Exception(esc_html__('Invalid data.', 'kirki-ecommerce-twocheckout'));
        }

        return $this->base64_url_encode(wp_json_encode($data));
    }

    /**
     * Encode data using the URL-safe base64 variant required by JWT.
     *
     * @param string $data The raw data to encode.
     *
     * @return string
     *
     * @throws Exception If the data is empty.
     */
    protected function base64_url_encode($data)
    {
        if (empty($data)) {
            throw new Exception(esc_html__('Invalid data.', 'kirki-ecommerce-twocheckout'));
        }

        $base64 = base64_encode($data);
        return str_replace(array('+', '/', '='), array('-', '_', ''), $base64);
    }

    /**
     * Calculate an HMAC hash of the given data using the API secret key.
     *
     * @param string $data      The length-prefixed string to hash.
     * @param string $algorithm The hashing algorithm, e.g. 'sha3-256'.
     *
     * @return string The hexadecimal hash.
     */
    public function generate_hash(string $data, string $algorithm): string
    {
        return hash_hmac($algorithm, $data, $this->secret_key);
    }

    /**
     * Build the read-receipt confirmation to echo back for a received IPN.
     *
     * @param Request $request The received IPN request.
     * @return string
     * @throws Exception If the receipt cannot be built.
     */
    public function build_read_receipt(Request $request): string
    {
        try {
            $ipn_fields = [
                'IPN_PID' => [$request->get('IPN_PID', null, 'string')[0]],
                'IPN_PNAME' => [$request->get('IPN_PNAME', null, 'string')[0]],
                'IPN_DATE' => $request->get('IPN_DATE', null, 'string'),
                'DATE' => date('YmdHis'),
            ];

            $result = '';
            foreach ($ipn_fields as $value) {
                $result .= $this->encode_length_prefixed((array) $value);
            }

            $signature_data = $this->get_received_signature($request);
            $signature = $this->generate_hash($result, $signature_data['algorithm']);

            return $this->format_read_receipt($signature_data['algorithm'], $ipn_fields['DATE'], $signature);
        } catch (Exception $error) {
            /* translators: %s: error message */
            throw new Exception(sprintf(esc_html__('Error building read receipt: %s', 'kirki-ecommerce-twocheckout'), $error->getMessage()));
        }
    }

    /**
     * Join array values as 2Checkout's length-prefixed hash input format.
     *
     * @param array $items The values to encode.
     * @return string
     */
    public function encode_length_prefixed(array $items): string
    {
        $encoded = '';

        foreach ($items as $item) {
            $encoded .= strlen(stripslashes($item)) . stripslashes($item);
        }

        return $encoded;
    }

    /**
     * Read the signature 2Checkout sent with the IPN, and which algorithm produced it.
     *
     * @param Request $request The received IPN request.
     * @return array{hash_value: string, algorithm: string}
     */
    public function get_received_signature(Request $request): array
    {
        $sha3 = $request->get('SIGNATURE_SHA3_256', null, 'string');
        $sha2 = $request->get('SIGNATURE_SHA2_256', null, 'string');

        if (!empty($sha3)) {
            return [
                'hash_value' => $sha3,
                'algorithm' => TwocheckoutConstant::IPN_SIGNATURE_ALGORITHM_SHA3,
            ];
        } elseif (!empty($sha2)) {
            return [
                'hash_value' => $sha2,
                'algorithm' => TwocheckoutConstant::IPN_SIGNATURE_ALGORITHM_SHA2,
            ];
        }

        return [
            'hash_value' => $request->get('HASH', null, 'string'),
            'algorithm' => TwocheckoutConstant::IPN_SIGNATURE_ALGORITHM_MD5,
        ];
    }

    /**
     * Format the IPN read receipt that acknowledges a processed notification.
     *
     * @param string $algorithm The algorithm used for the signature.
     * @param string $date      The receipt date in 2Checkout's expected format.
     * @param string $signature The calculated acknowledgement signature.
     *
     * @return string The response body to output to 2Checkout.
     */
    protected function format_read_receipt(string $algorithm, string $date, string $signature): string
    {
        if (TwocheckoutConstant::IPN_SIGNATURE_ALGORITHM_MD5 === $algorithm) {
            return sprintf('<EPAYMENT>%s|%s</EPAYMENT>', $date, $signature);
        }

        return sprintf('<sig algo="%s" date="%s">%s</sig>', $algorithm, $date, $signature);
    }
}
