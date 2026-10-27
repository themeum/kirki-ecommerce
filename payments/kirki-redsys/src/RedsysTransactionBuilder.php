<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds the Ds_MerchantParameters payload for a Redsys payment.
 */
class RedsysTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order  $order            The order being paid.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build the merchant parameters for the checkout form.
     *
     * @return array
     */
    public function build_merchant_params(): array
    {
        return [
            'DS_MERCHANT_URLOK' => Url::get_checkout_success_url($this->order->uuid),
            'DS_MERCHANT_URLKO' => Url::get_checkout_failed_url($this->order->uuid),
            'DS_MERCHANT_TRANSACTIONTYPE' => RedsysConstant::TRANSACTION_TYPE_AUTHORIZATION,
            'DS_MERCHANT_MERCHANTDATA' => $this->order->uuid,
            'DS_MERCHANT_ORDER' => $this->generate_order_number(),
            'DS_MERCHANT_CURRENCY' => Money::get_currency_numeric_code($this->order->currency_code),
            'DS_MERCHANT_AMOUNT' => (int) $this->order->invoiced_total,
            'DS_MERCHANT_EMV3DS' => wp_json_encode($this->build_emv_3ds()),
        ];
    }

    /**
     * Build the 3-D Secure cardholder address data.
     *
     * @return array
     */
    protected function build_emv_3ds(): array
    {
        [$billing_line1, $billing_line2] = $this->split_address('billing');
        [$shipping_line1, $shipping_line2] = $this->split_address('shipping');

        return [
            'billAddrCity' => $this->order->billing_city,
            'billAddrCountry' => $this->order->billing_country,
            'billAddrLine1' => $billing_line1,
            'billAddrLine2' => $billing_line2,
            'billAddrPostCode' => $this->order->billing_postal_code,
            'billAddrState' => $this->order->billing_state,
            'shipAddrCity' => $this->order->shipping_city,
            'shipAddrCountry' => $this->order->shipping_country,
            'shipAddrLine1' => $shipping_line1,
            'shipAddrLine2' => $shipping_line2,
            'shipAddrPostCode' => $this->order->shipping_postal_code,
            'shipAddrState' => $this->order->shipping_state,
        ];
    }

    /**
     * Split an address into the two lines Redsys accepts.
     *
     * @param string $type Either 'billing' or 'shipping'.
     * @return array{0: string, 1: string}
     */
    protected function split_address(string $type): array
    {
        $max_length = RedsysConstant::ADDRESS_LINE_MAX_LENGTH;
        $line1 = (string) ($this->order->{$type . '_address_line1'} ?? '');
        $line2 = (string) ($this->order->{$type . '_address_line2'} ?? '');

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

    /**
     * Generate the Redsys order number, which must be unique per transaction.
     *
     * @return int
     */
    protected function generate_order_number(): int
    {
        return wp_rand(RedsysConstant::ORDER_NUMBER_MIN, RedsysConstant::ORDER_NUMBER_MAX);
    }
}
