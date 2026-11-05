<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;

defined('ABSPATH') || exit;

/**
 * Builds bKash create payment payloads.
 */
class BkashTransactionBuilder
{
    /** @var Order */
    protected Order $order;

    /**
     * @param Order $order The order to build the bKash payload for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build the payload for the bKash create payment endpoint.
     *
     * @param string $callback_url The URL bKash returns the customer to.
     * @return array<string, string>
     */
    public function build_payment_payload(string $callback_url): array
    {
        return [
            'payerReference' => $this->order->uuid,
            'callbackURL' => $callback_url,
            'amount' => PaymentProvider::format_amount($this->order->invoiced_total, BkashConstant::CURRENCY),
            'currency' => BkashConstant::CURRENCY,
            'intent' => BkashConstant::INTENT_SALE,
            'merchantInvoiceNumber' => $this->order->uuid,
        ];
    }
}
