<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\Framework\Supports\Str;

defined('ABSPATH') || exit;

/**
 * Builds Square request payloads and interprets transaction status.
 *
 */
class SquareTransactionBuilder
{
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

        return $line_items;
    }
}
