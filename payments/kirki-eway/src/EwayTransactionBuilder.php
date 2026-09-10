<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds Eway request payloads and interprets transaction status.
 *
 */
class EwayTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order to build QuickPay payloads for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function build_transaction_payload()
    {
        $billing_address = $this->split_address(50, 'billing');
        $shipping_address = $this->split_address(50, 'shipping');

        return [
            'Method' => EwayConstant::PROCESS_PAYMENT,
            'TransactionType' => EwayConstant::TRANSACTION_TYPE_PURCHASE,
            'RedirectUrl' => Url::get_checkout_success_url($this->order->uuid),
            'CancelUrl' => Url::get_checkout_failed_url($this->order->uuid),
            'CustomerReadOnly'    => true,
            'VerifyCustomerPhone' => true,
            'VerifyCustomerEmail' => true,
            'Capture' => true,
            'Customer' => [
                'FirstName' => $this->limit_string_length($this->order->customer_first_name, 30) ?? '',
                'LastName' => $this->limit_string_length($this->order->customer_last_name, 30) ?? '',
                'Street1' => $billing_address[0] ?? '',
                'Street2' => $billing_address[1] ?? '',
                'City' => $this->limit_string_length($this->order->billing_city, 50) ?? '',
                'State' => $this->limit_string_length($this->order->billing_state, 50) ?? '',
                'PostalCode' => $this->limit_string_length($this->order->billing_postal_code, 30) ?? '',
                'Country' => $this->order->billing_country ?? '',
                'Mobile' => $this->order->billing_phone ?? '',
                'Email' => $this->order->billing_email ?? '',
            ],
            'ShippingAddress' => [
                'FirstName' => $this->limit_string_length($this->order->shipping_first_name, 30) ?? '',
                'LastName' => $this->limit_string_length($this->order->shipping_first_name, 30) ?? '',
                'Street1' => $shipping_address[0] ?? '',
                'Street2' => $shipping_address[1] ?? '',
                'City' => $this->limit_string_length($this->order->shipping_city, 50) ?? '',
                'State' => $this->limit_string_length($this->order->shipping_state, 50) ?? '',
                'Country' => $this->order->shipping_country ?? '',
                'PostalCode' => $this->order->shipping_postal_code ?? '',
                'Phone' => $this->order->shipping_phone ?? '',
                'Email' => $this->order->shipping_email ?? ''
            ],
            'Items' => $this->get_items(),
            'Options' => [['Value' => $this->order->uuid]],
            'Payment' => [
                'TotalAmount' => $this->order->invoiced_total,
                'CurrencyCode' => $this->order->currency_code,
            ]
        ];
    }

    protected function split_address(int $max_length, string $type): array
    {
        $address_line1 = $this->order->{$type . '_address_line1'} ?? '';
        $address_line2 = $this->order->{$type . '_address_line2'} ?? '';

        $address_line1 = $this->order->{$type . '_address_line1'} ?? $this->order->{$type . '_address_line2'} ?? '';

        if (empty($address_line1) && empty($address_line2)) {
            return [];
        }

        $address_1 = mb_strimwidth($address_line1, 0, $max_length);
        $address_2 = strlen($address_line1) > $max_length
            ? mb_strimwidth($address_line1, $max_length, $max_length) : $address_line2;

        return [$address_1, $address_2];
    }

    protected function limit_string_length(?string $string, int $length): string
    {
        if (empty($string) || empty($length)) {
            return '';
        }

        if (mb_strlen($string) <= $length) {
            return $string;
        }

        $suffix = '...';

        return Str::take($string, $length - mb_strlen($suffix)) . $suffix;
    }

    protected function get_items()
    {
        $line_items = [];

        foreach ($this->order->items as $item) {
            $line_items[] = [
                'Description' => $item->product_name,
                'Quantity' => (int) $item->quantity,
                'Total' => (int) $item->invoiced_total,
                'UnitCost' => (int) $item->invoiced_price,
            ];
        }

        if (!empty($this->order->invoiced_tax_total)) {
            $line_items[] = $this->create_additional_charge('Tax', $this->order->invoiced_tax_total);
        }

        if (!empty($this->order->invoiced_shipping_total)) {
            $line_items[] = $this->create_additional_charge('Shipping Charge', $this->order->invoiced_shipping_total);
        }

        if (!empty($this->order->invoiced_discount_total)) {
            $line_items[] = $this->create_additional_charge('Coupon Discount', -$this->order->invoiced_discount_total);
        }

        return $line_items;
    }

    protected function create_additional_charge($name, $cost): array
    {
        if (empty($name) || empty($cost)) {
            return [];
        }
        return [
            'Description' => $name,
            'Quantity' => 1,
            'UnitCost' => $cost,
            'Total' => $cost
        ];
    }
}
