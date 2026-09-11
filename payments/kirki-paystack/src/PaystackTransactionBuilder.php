<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds PayStack transaction initialization payloads.
 */
class PaystackTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order to build the PayStack payload for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build the payload for PayStack's transaction/initialize endpoint.
     *
     * @return array
     */
    public function build_transaction_payload(): array
    {
        return [
            'amount' => (string) $this->order->invoiced_total,
            'email' => $this->order->customer_email ?? '',
            'currency' => $this->order->currency_code,
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
