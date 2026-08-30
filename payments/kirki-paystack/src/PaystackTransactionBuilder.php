<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds Square request payloads and interprets transaction status.
 *
 */
class PaystackTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order to build QuickPay payloads for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build Square order line_items for an order's items, shipping, and tax.
     *
     * @return array
     */
    public function build_transaction_payload(): array
    {
        return [
            'amount' => (string) $this->order->invoiced_total,
            'email' => $this->order->customer_email ?? '',
            'currency' => 'NGN', //$order->currency_code,
            'reference' => $this->order->uuid,
            'callback_url' => Url::get_checkout_success_url($this->order->uuid),
            'metadata' => wp_json_encode([
                'order_uuid' => $this->order->uuid,
                'cancel_action' => Url::get_checkout_failed_url($this->order->uuid),
            ]),
            'channels' => [
                "card",
                "bank",
                "ussd",
                "qr",
                "mobile_money",
                "bank_transfer",
                "eft",
            ]
        ];
    }
}
