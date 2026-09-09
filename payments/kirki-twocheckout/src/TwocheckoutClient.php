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

    public function generate_hash($data, $algorithm): string
    {
        if (in_array($algorithm, ['sha3-256', 'sha256'], true)) {
            return hash_hmac($algorithm, $data, $this->secret_key);
        }

        // byte length for hash.
        $byte_length = 64;

        if (strlen($this->secret_key) > $byte_length) {
            $key = pack('H*', hash($algorithm, $this->secret_key));
        }

        $key    = str_pad($this->secret_key, $byte_length, chr(0x00));
        $ipad   = str_pad('', $byte_length, chr(0x36));
        $opad   = str_pad('', $byte_length, chr(0x5c));
        $k_ipad = $key ^ $ipad;
        $k_opad = $key ^ $opad;

        return hash($algorithm, $k_opad . pack('H*', hash($algorithm, $k_ipad . $data)));
    }

    public function generate_ipn_response($payload)
    {
        try {
            $result_response     = '';
            $ipn_params_response = array();

            $ipn_params_response['IPN_PID'][0]   = $payload->get('IPN_PID', null, 'string')[0];
            $ipn_params_response['IPN_PNAME'][0] = $payload->get('IPN_PNAME', null, 'string')[0];
            $ipn_params_response['IPN_DATE']     = $payload->get('IPN_DATE', null, 'string');
            $ipn_params_response['DATE']         = date('YmdHis');

            foreach ($ipn_params_response as $value) {
                $result_response .= $this->array_expand((array) $value);
            }

            $algorithm = $this->get_hash_algorithm($payload);
            $signature = $this->generate_hash($result_response, $algorithm['algorithm']);

            return $this->format_response($algorithm['algorithm'], $ipn_params_response['DATE'], $signature);
        } catch (Exception $error) {
            /* translators: %s: error message */
            throw new Exception(sprintf('Exception Generating IPN Response: %s', $error->getMessage()));
        }
    }

    public function array_expand($items): string
    {
        $expanded_string = '';

        foreach ($items as $item_value) {
            $item_length      = strlen(stripslashes($item_value));
            $expanded_string .= $item_length . stripslashes($item_value);
        }

        return $expanded_string;
    }

    public function get_hash_algorithm($payload)
    {
        $sha3 = $payload->get('SIGNATURE_SHA3_256', null, 'string');
        $sha2 = $payload->get('SIGNATURE_SHA2_256', null, 'string');

        if (!empty($sha3)) {
            return [
                'hash_value' => $sha3,
                'algorithm' => 'sha3-256',
            ];
        } elseif (!empty($sha2)) {
            return [
                'hash_value' => $sha2,
                'algorithm'  => 'sha256',
            ];
        }

        return [
            'hash_value' => $payload->get('HASH', null, 'string'),
            'algorithm'  => 'md5',
        ];
    }

    protected function format_response($algorithm, $date, $signature): string
    {

        if ('md5' === $algorithm) {
            return sprintf(
                '<EPAYMENT>%s|%s</EPAYMENT>',
                $date,
                $signature
            );
        }

        return sprintf(
            '<sig algo="%s" date="%s">%s</sig>',
            $algorithm,
            $date,
            $signature
        );
    }
}
