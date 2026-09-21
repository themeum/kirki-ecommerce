<?php

namespace Kirki\Ecommerce\Payments;

defined('ABSPATH') || exit;

/**
 * Encodes, signs and verifies Redsys merchant parameters.
 *
 * Redsys diversifies the merchant signature key with the order number of the
 * transaction being signed, then keys an HMAC with the result. Both the
 * parameters and the signature travel as URL-safe base64.
 */
class RedsysSignature
{
    protected string $signature_key;

    /**
     * @param string $signature_key The merchant signature key from the Redsys panel.
     */
    public function __construct(string $signature_key)
    {
        $this->signature_key = $signature_key;
    }

    /**
     * Encode merchant parameters for the Ds_MerchantParameters field.
     *
     * @param array $merchant_params
     * @return string
     */
    public function encode_parameters(array $merchant_params): string
    {
        return $this->base64_url_encode(wp_json_encode($merchant_params));
    }

    /**
     * Decode the Ds_MerchantParameters field of a Redsys notification.
     *
     * @param string $encoded_parameters
     * @return object|null The decoded parameters, or null when the payload is not valid JSON.
     */
    public function decode_parameters(string $encoded_parameters)
    {
        $parameters = json_decode($this->base64_url_decode($encoded_parameters));

        return is_object($parameters) ? $parameters : null;
    }

    /**
     * Sign encoded merchant parameters for the given order number.
     *
     * @param string $encoded_parameters
     * @param string $order_number
     * @return string
     */
    public function sign(string $encoded_parameters, string $order_number): string
    {
        $key = $this->derive_key($order_number);
        $hash = hash_hmac(RedsysConstant::SIGNATURE_ALGORITHM, $encoded_parameters, $key, true);

        return $this->base64_url_encode($hash);
    }

    /**
     * Check a signature received from Redsys against the expected one.
     *
     * @param string $encoded_parameters
     * @param string $order_number
     * @param string $signature
     * @return bool
     */
    public function verify(string $encoded_parameters, string $order_number, string $signature): bool
    {
        $expected = $this->sign($encoded_parameters, $order_number);

        return hash_equals($expected, $this->to_url_safe($signature));
    }

    /**
     * Diversify the signature key with the order number.
     *
     * @param string $order_number
     * @return string
     */
    protected function derive_key(string $order_number): string
    {
        $key = str_pad(substr($this->signature_key, 0, RedsysConstant::KEY_LENGTH), RedsysConstant::KEY_LENGTH, '0');

        $encrypted = openssl_encrypt(
            $order_number,
            RedsysConstant::KEY_CIPHER,
            $key,
            OPENSSL_RAW_DATA,
            str_repeat("\0", RedsysConstant::KEY_LENGTH)
        );

        return base64_encode($encrypted);
    }

    protected function base64_url_encode(string $input): string
    {
        return $this->to_url_safe(base64_encode($input));
    }

    protected function base64_url_decode(string $input): string
    {
        $padded = str_pad($input, strlen($input) + (4 - strlen($input) % 4) % 4, '=', STR_PAD_RIGHT);

        return (string) base64_decode(strtr($padded, '-_', '+/'));
    }

    protected function to_url_safe(string $base64): string
    {
        return str_replace('=', '', strtr($base64, '+/', '-_'));
    }
}
