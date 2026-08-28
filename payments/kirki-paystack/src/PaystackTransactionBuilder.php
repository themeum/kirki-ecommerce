<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;

defined('ABSPATH') || exit;

/**
 * Builds Square request payloads and interprets transaction status.
 *
 */
class PaystackTransactionBuilder
{
    /**
     * Build Square order line_items for an order's items, shipping, and tax.
     *
     * @param Order $order
     * @return array
     */
    public static function build_line_items(Order $order): array
    {
        $line_items = [];

        foreach ($order->items as $item) {
            $line_items[] = [
                'uid' => (string) $item->id,
                'name' => $item->product_name,
                'quantity' => (string) $item->quantity,
                'base_price_money' => [
                    'amount' => (int) $item->invoiced_total,
                    'currency' => strtoupper($order->currency_code)
                ],
            ];
        }

        if (!empty($order->invoiced_shipping_total)) {
            $line_items[] = [
                'name' => __('Shipping Charge', 'kirki-ecommerce-square'),
                'quantity' => '1',
                'base_price_money' => [
                    'amount' => (int) $order->invoiced_shipping_total,
                    'currency' => strtoupper($order->currency_code)
                ],
            ];
        }

        if (!empty($order->invoiced_tax_total)) {
            $line_items[] = [
                'name' => __('Tax', 'kirki-ecommerce-square'),
                'quantity' => '1',
                'base_price_money' => [
                    'amount' => (int) $order->invoiced_tax_total,
                    'currency' => strtoupper($order->currency_code)
                ],
            ];
        }

        return $line_items;
    }
}
