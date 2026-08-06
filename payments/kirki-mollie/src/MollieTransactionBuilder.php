<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentGateway;

defined('ABSPATH') || exit;

class MollieTransactionBuilder
{
    protected $order;
    public function __construct(Order $order = null)
    {
        $this->order = $order;
    }
    public function build_line_items(): array
    {
        $line_items = [];

        foreach ($this->order->items as $item) {
            $line_items[] = $this->build_line_item($item);
        }

        return $line_items;
    }

    protected function build_line_item(object $item): array
    {
        $unit_price = $item->price + ($item->tax_total ?? 0);


        $line_item = [
            'description' => $item->product_name,
            'quantity'    => (int) $item->quantity,
            'unitPrice'   => $this->money($unit_price),
            'totalAmount' => $this->money($item->total),
        ];

        if (!empty($item->discount_amount)) {
            $line_item['discountAmount'] = $this->money($item->discount_amount);
        }

        if (!empty($item->tax_rate)) {
            $line_item['vatRate']   = (string) $item->tax_rate;
            $line_item['vatAmount'] = $this->money($item->tax_total ?? 0);
        }

        return $line_item;
    }

    protected function money(float $amount): array
    {
        return [
            'currency' => strtoupper($this->order->currency_code),
            'value'    => PaymentGateway::format_amount($amount),
        ];
    }

    public function get_address($type): array
    {
        if (empty($address)) {
            return [];
        }

        return [
            'givenName'        => $this->order->{$type . '_first_name'},
            'familyName'       => $this->order->{$type . '_last_name'},
            'email'            => $this->order->{$type . '_email'},
            'phone'            => $this->order->{$type . '_phone'},
            'streetAndNumber'  => $this->order->{$type . '_address_line1'},
            'streetAdditional' => $this->order->{$type . '_address_line2'},
            'city'             => $this->order->{$type . '_city'},
            'postalCode'       => $this->order->{$type . '_postal_code'},
            'country'          => $this->order->{$type . '_country'},
        ];
    }
}
