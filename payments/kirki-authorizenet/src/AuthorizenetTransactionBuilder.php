<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentGateway;
use Kirki\Ecommerce\Framework\Supports\Str;

defined('ABSPATH') || exit;

/**
 * Builds Authorize.Net request payloads and interprets transaction status.
 *
 */
class AuthorizenetTransactionBuilder
{
    /**
     * Build the `transactionRequest` block for a hosted payment page request.
     *
     * @param Order $order The order being paid for.
     * @return array
     */
    public function build_transaction_request(Order $order): array
    {
        $transaction_request = [
            'transactionType' => 'authCaptureTransaction',
            'amount' => PaymentGateway::format_amount($order->invoiced_total, $order->currency_code),
            'lineItems' => [
                'lineItem' => $this->build_line_items($order),
            ],
        ];

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

    /**
     * Build the `lineItem` list from the order's line items.
     *
     * @param Order $order
     * @return array
     */
    protected function build_line_items(Order $order): array
    {
        $line_items = [];

        foreach ($order->items as $item) {
            $line_items[] = [
                'itemId' => (string) $item->id,
                'name' => $this->limit_string_length($item->product_name, 31),
                'description' => $this->limit_string_length($item->product_name, 255),
                'quantity' => (float) $item->quantity,
                'unitPrice' => (float) PaymentGateway::format_amount($item->invoiced_subtotal, $order->currency_code),
            ];
        }

        return $line_items;
    }

    /**
     * Build the `hostedPaymentSettings.setting` list for the hosted payment page request.
     *
     * @param array $urls Array of success and cancel url.
     * @return array
     */
    public function build_hosted_payment_settings(array $urls): array
    {
        $settings = [
            'hostedPaymentReturnOptions' => [
                'showReceipt' => true,
                'url' => $this->encode_return_url($urls['success_url']),
                'cancelUrl' => $this->encode_return_url($urls['cancel_url']),
            ],
            'hostedPaymentPaymentOptions' => [
                'cardCodeRequired' => true,
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

    /**
     * Percent-encode reserved URL characters so the return URL survives being
     * embedded as a settingValue inside the hosted payment settings JSON.
     *
     * @param string $url
     * @return string
     */
    protected function encode_return_url(string $url): string
    {
        return str_replace(['?', '=', '&'], ['%3F', '%3D', '%26'], $url);
    }

    /**
     * Truncate a string to a maximum length, appending "..." if it was cut short.
     *
     * @param string|null $string
     * @param int $length
     * @return string
     */
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

    /**
     * Build the `billTo`/`shipTo` address block for an order.
     *
     * @param Order $order
     * @param string $type Either 'billing' or 'shipping'.
     * @return array Empty if the order has no address of this type.
     */
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

    /**
     * Split an order's address into two lines, each capped at `$max_length`.
     *
     * @param Order $order
     * @param int $max_length Maximum characters per line.
     * @param string $type Either 'billing' or 'shipping'.
     * @return array{0: string, 1: string}|array{} Two address lines, or empty if the order has no address.
     */
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

    /**
     * Map an Authorize.Net transaction response.
     *
     * @param object $transaction The `transaction` object from a getTransactionDetailsRequest response.
     * @return string One of PAID, PENDING, CANCELED, FAILED, or '' if `$transaction` is empty.
     */
    public function get_transaction_status($transaction): string
    {
        if (empty($transaction)) {
            return '';
        }

        $transaction_status = $transaction->transactionStatus;
        $transaction_response_code = $transaction->responseCode;

        $transaction_errors = ['communicationError', 'generalError', 'settlementError', 'expired'];

        if (AuthorizenetConstant::CAPTURED_PENDING_SETTLEMENT === $transaction_status && 1 === $transaction_response_code) {
            return AuthorizenetConstant::PAID;
        }

        if (in_array($transaction_status, [AuthorizenetConstant::DECLINED,AuthorizenetConstant::VOIDED])) {
            return AuthorizenetConstant::CANCELED;
        }

        if (in_array($transaction_status, $transaction_errors, true)) {
            return AuthorizenetConstant::FAILED;
        }

        return AuthorizenetConstant::PENDING;
    }
}
