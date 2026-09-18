<?php

namespace Kirki\Ecommerce\Payments;

use Brick\Money\Currency;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds Square request payloads and interprets transaction status.
 *
 */
class RedsysTransactionBuilder
{
    protected ?Order $order = null;

    /**
     * @param Order $order The order to build the 2Checkout buy-link payload for.
     */
    public function __construct(?Order $order = null)
    {
        $this->order = $order;
    }
    public function create_merchant_params(): array
    {
        [$billing_line1, $billing_line2] = $this->split_address(50, 'billing');
        [$shipping_line1, $shipping_line2] = $this->split_address(50, 'shipping');

        $EMV3DS = [
            'billAddrCity'     => $this->order->billing_city,
            'billAddrCountry'  => $this->order->billing_country,
            'billAddrLine1'    => $billing_line1,
            'billAddrLine2'    => $billing_line2,
            'billAddrPostCode' => $this->order->billing_postal_code,
            'billAddrState'    => $this->order->billing_state,
            'shipAddrCity'     => $this->order->shipping_city,
            'shipAddrCountry'  => $this->order->shipping_country,
            'shipAddrLine1'    => $shipping_line1,
            'shipAddrLine2'    => $shipping_line2,
            'shipAddrPostCode' => $this->order->shipping_postal_code,
            'shipAddrState'    => $this->order->shipping_state
        ];
        return [
            'DS_MERCHANT_URLOK' => Url::get_checkout_success_url($this->order->uuid),
            'DS_MERCHANT_URLKO' => Url::get_checkout_failed_url($this->order->uuid),
            'DS_MERCHANT_TRANSACTIONTYPE' => 0,
            'DS_MERCHANT_MERCHANTDATA' => $this->order->uuid,
            'DS_MERCHANT_ORDER' => wp_rand(1000, 100000000000),
            'DS_MERCHANT_CURRENCY' => (int) Money::get_currency_numeric_code($this->order->currency_code),
            'DS_MERCHANT_AMOUNT' => (int) $this->order->invoiced_total,
            'DS_MERCHANT_EMV3DS' => wp_json_encode($EMV3DS),
        ];
    }

    protected function split_address(int $max_length, string $type): array
    {
        $line1 = (string) ($this->order->{$type . '_address_line1'} ?? '');
        $line2 = (string) ($this->order->{$type . '_address_line2'} ?? '');

        if (empty($line1) && empty($line2)) {
            return [];
        }

        // Line 1 fits — keep both lines as entered.
        if (mb_strlen($line1) <= $max_length) {
            return [$line1, mb_substr($line2, 0, $max_length)];
        }

        // Line 1 overflows — spill the remainder into line 2.
        $combined = trim($line1 . ' ' . $line2);

        return [
            mb_substr($combined, 0, $max_length),
            mb_substr($combined, $max_length, $max_length),
        ];
    }

    public function base64_url_encode_safe($input)
    {
        return str_replace("=", "", strtr(base64_encode($input), '+/', '-_'));
    }

    public function create_merchant_signature($signature_key, $encoded_merchant_params, $order_uuid)
    {
        // The key is diversified using the Order UUID.
        $key = $this->encrypt_AES($signature_key, $order_uuid);

        // MAC512 from the Ds_Parameters parameter sent by Redsys.
        $res = $this->mac512($encoded_merchant_params, $key);

        return $this->base64_url_encode_safe($res);
    }

    protected function encrypt_AES($signature_key, $data)
    {
        $fixed_key = str_pad(substr($signature_key, 0, 16), 16, "0");
        $signature = base64_encode(openssl_encrypt($data, "aes-128-cbc", $fixed_key, OPENSSL_RAW_DATA, "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"));

        return $signature;
    }

    protected function mac512($data, $key)
    {
        $sha = hash_hmac('sha512', $data, $key, true);
        return $sha;
    }
}
