<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;

defined('ABSPATH') || exit;

class AuthorizenetRequestBuilder
{
    public function build_transaction_request(Order $order): array
    {
        $transaction_request = [
            'transactionType' => 'authCaptureTransaction',
            'amount' => $this->format_amount($order->total, $order->currency_code),
            'lineItems' => [
                'lineItem' => $this->build_line_items($order),
            ],
        ];

        if (!empty($order->tax_total)) {
            $transaction_request['tax'] = [
                'amount' => $this->format_amount($order->tax_total, $order->currency_code),
                'name' => 'Tax',
            ];
        }

        if (!empty($order->shipping_total)) {
            $transaction_request['shipping'] = [
                'amount' => $this->format_amount($order->shipping_total, $order->currency_code),
                'name' => 'Shipping Charge',
            ];
        }

        $transaction_request['poNumber'] = (string) $order->id;

        if (!empty($order->customer_email)) {
            $transaction_request['customer'] = [
                'type' => 'individual',
                'email' => $order->customer_email,
            ];
        }

        $billing_address = $this->get_address($order, 'billing');
        $shipping_address = $this->get_address($order, 'shipping');

        if (!empty($billing_address)) {
            $transaction_request['billTo'] = $billing_address;
        }

        if (!empty($shipping_address)) {
            $transaction_request['shipTo'] = $shipping_address;
        }

        return $transaction_request;
    }

    protected function format_amount($amount, string $currency): string
    {
        return number_format(Money::from_minor($amount, $currency)->getAmount()->toFloat(), 2, '.', '');
    }

    protected function build_line_items(Order $order): array
    {
        $line_items = [];

        foreach ($order->items as $item) {
            $line_items[] = [
                'itemId' => $item->id,
                'name' => $this->limit_string_length($item->product_name, 31),
                'description' => $this->limit_string_length($item->product_name, 255),
                'quantity' => (float) $item->quantity,
                'unitPrice' => (float) $this->format_amount($item->price, $order->currency_code),
            ];
        }

        return $line_items;
    }

    public function build_hosted_payment_settings($url): array
    {
        return [
            'setting' => [
                [
                    'settingName' => 'hostedPaymentReturnOptions',
                    'settingValue' => wp_json_encode([
                        'showReceipt' => true,
                        'url' => $this->encode_return_url($url . '&action=success'),
                        'cancelUrl' => $this->encode_return_url($url . '&action=cancel'),
                    ]),
                ],
                [
                    'settingName' => 'hostedPaymentPaymentOptions',
                    'settingValue' => wp_json_encode([
                        'cardCodeRequired' => false,
                        'showCreditCard' => true,
                        'showBankAccount' => true,
                    ]),
                ],
                [
                    'settingName' => 'hostedPaymentSecurityOptions',
                    'settingValue' => wp_json_encode(['captcha' => true]),
                ],
                [
                    'settingName' => 'hostedPaymentShippingAddressOptions',
                    'settingValue' => wp_json_encode(['show' => true]),
                ],
                [
                    'settingName' => 'hostedPaymentBillingAddressOptions',
                    'settingValue' => wp_json_encode(['show' => true]),
                ],
                [
                    'settingName' => 'hostedPaymentCustomerOptions',
                    'settingValue' => wp_json_encode(['showEmail' => true]),
                ],
                [
                    'settingName' => 'hostedPaymentOrderOptions',
                    'settingValue' => wp_json_encode(['show' => true]),
                ],
            ],
        ];
    }

    protected function encode_return_url(string $url): string
    {
        return str_replace(['?', '=', '&'], ['%3F', '%3D', '%26'], $url);
    }

    protected function limit_string_length(?string $string, int $length): string
    {
        if (empty($string) || empty($length)) {
            return '';
        }

        $suffix = '...';

        if (mb_strlen($string) > $length) {
            return mb_substr($string, 0, $length - mb_strlen($suffix)) . $suffix;
        }

        return $string;
    }

    protected function get_address(Order $order, string $type): array
    {
        [$address_line1, $address_line2] = $this->split_address($order, 60, $type);

        if (empty($address_line1)) {
            return [];
        }

        $address = [
            'firstName' => $this->limit_string_length($order->{$type . '_first_name'}, 50),
            'lastName' => $this->limit_string_length($order->{$type . '_last_name'}, 50),
            'address' => $address_line1,
            'city' => $this->limit_string_length($order->{$type . '_city'}, 40),
            'state' => $this->limit_string_length($order->{$type . '_state'}, 40),
            'zip' => $this->limit_string_length($order->{$type . '_postal_code'}, 20),
            'country' => $order->{$type . '_country'} ?? '',
        ];

        if ('billing' === $type) {
            $address['phoneNumber'] = $this->limit_string_length($order->{$type . '_phone'}, 25);
        }

        return $address;
    }

    protected function split_address(Order $order, int $max_length, string $type): array
    {
        $address_line1 = $order->{$type . '_address_line1'} ?? $order->{$type . '_address_line2'} ?? '';

        if (empty($address_line1)) {
            return ['', ''];
        }

        if (mb_strlen($address_line1) <= $max_length) {
            return [$address_line1, $order->{$type . '_address_line1'} ?? $order->{$type . '_address_line2'} ?? ''];
        }

        return [
            mb_strimwidth($address_line1, 0, $max_length),
            mb_strimwidth($address_line1, $max_length, $max_length),
        ];
    }
}
