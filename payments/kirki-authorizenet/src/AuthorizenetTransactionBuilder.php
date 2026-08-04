<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Supports\Str;

defined('ABSPATH') || exit;

class AuthorizenetTransactionBuilder
{
    public const PAID = 'paid';
    public const CANCELED = 'canceled';
    public const FAILED = 'failed';
    public const PENDING = 'pending';
    private const CAPTURED_PENDING_SETTLEMENT = 'capturedPendingSettlement';
    private const DECLINED = 'declined';

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
                'itemId' => (string) $item->id,
                'name' => $this->limit_string_length($item->product_name, 31),
                'description' => $this->limit_string_length($item->product_name, 255),
                'quantity' => (string) $item->quantity,
                'unitPrice' => $this->format_amount($item->price, $order->currency_code),
            ];
        }

        return $line_items;
    }

    public function build_hosted_payment_settings($url): array
    {
        $settings = [
            'hostedPaymentReturnOptions' => [
                'showReceipt' => true,
                'url' => $this->encode_return_url($url . '&action=success'),
                'cancelUrl' => $this->encode_return_url($url . '&action=cancel'),
            ],
            'hostedPaymentPaymentOptions' => [
                'cardCodeRequired' => false,
                'showCreditCard' => true,
                'showBankAccount' => true,
            ],
            'hostedPaymentSecurityOptions' => ['captcha' => true],
            'hostedPaymentShippingAddressOptions' => ['show' => true],
            'hostedPaymentBillingAddressOptions' => ['show' => true],
            'hostedPaymentCustomerOptions' => ['showEmail' => true],
            'hostedPaymentOrderOptions' => ['show' => true],
        ];

        return [
            'setting' => array_map(
                fn($name, $value) => ['settingName' => $name, 'settingValue' => wp_json_encode($value)],
                array_keys($settings),
                $settings
            ),
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

        if (mb_strlen($string) <= $length) {
            return $string;
        }

        $suffix = '...';

        return Str::take($string, $length - mb_strlen($suffix)) . $suffix;
    }

    protected function get_address(Order $order, string $type): array
    {
        [$address_line1, $address_line2] = $this->split_address($order, 60, $type);

        if (empty($address_line1) && empty($address_line2)) {
            return [];
        }

        $address = [
            'firstName' => $this->limit_string_length($order->{$type . '_first_name'}, 50),
            'lastName' => $this->limit_string_length($order->{$type . '_last_name'}, 50),
            'address' => $address_line1 ?? $address_line2,
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
        $address_line1 = $order->{$type . '_address_line1'} ?? '';
        $address_line2 = $order->{$type . '_address_line2'} ?? '';

        $address_line1 = $order->{$type . '_address_line1'} ?? $order->{$type . '_address_line2'} ?? '';

        if (empty($address_line1) && empty($address_line2)) {
            return [];
        }

        $address_1 = mb_strimwidth($address_line1, 0, $max_length);
        $address_2 = strlen($address_line1) > $max_length
                    ? mb_strimwidth($address_line1, $max_length, $max_length) : $address_line2;

        return [$address_1, $address_2];
    }

    public function get_transaction_status($transaction): string
    {
        if (empty($transaction)) {
            return '';
        }

        $transaction_status = $transaction->transactionStatus;
        $transaction_response_code = $transaction->responseCode;

        $transaction_errors = ['communicationError', 'generalError', 'settlementError', 'expired'];

        if (static::CAPTURED_PENDING_SETTLEMENT === $transaction_status && 1 === $transaction_response_code) {
            return static::PAID;
        }

        if (static::DECLINED === $transaction_status) {
            return static::CANCELED;
        }

        if (in_array($transaction_status, $transaction_errors, true)) {
            return static::FAILED;
        }

        return static::PENDING;
    }
}
