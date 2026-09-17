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
    protected Order $order;

    /**
     * @param Order $order The order to build the 2Checkout buy-link payload for.
     */
    public function __construct(Order $order)
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
            'DS_MERCHANT_URLKO' => Url::get_checkout_success_url($this->order->uuid),
            'DS_MERCHANT_TRANSACTIONTYPE' => 0,
            'DS_MERCHANT_ORDER' => $this->order->uuid,
            'DS_MERCHANT_CURRENCY' => Money::get_currency_numeric_code($this->order->currency_code),
            'DS_MERCHANT_AMOUNT' => $this->order->invoiced_total,
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
}
