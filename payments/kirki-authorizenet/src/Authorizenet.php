<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentGateway;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

class Authorizenet extends PaymentGateway
{
    private $merchant_authentication;
    private $header;

    const SANDBOX_API_ENDPOINT = 'https://apitest.authorize.net/xml/v1/request.api';
    const PRODUCTION_API_ENDPOINT = 'https://api.authorize.net/xml/v1/request.api';
    const FORM_URL_SANDBOX     = 'https://test.authorize.net/payment/payment';
    const FORM_URL_PRODUCTION  = 'https://accept.authorize.net/payment/payment';
    public function __construct()
    {
        $this->id = 'authorizenet';
        $this->title = __('AuthorizeNet', 'kirki-ecommerce');
        $this->description = __('AuthorizeNet payment gateway', 'kirki-ecommerce');
        $this->icon = 'authorizenet';
        $this->settings_key = 'authorizenet';
        $this->is_manual = false;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'login_id',
                'label' => __('Login ID', 'kirki-ecommerce'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'transaction_key',
                'label' => __('Transaction key', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'signature_key',
                'label' => __('Signature key', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * Pay for an order.
     *
     * @param Order $order
     * @return string
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('AuthorizeNet is not enabled.', 'kirki-ecommerce'));
        }

        if (!$this->check_currency($order->currency_code)) {
            throw new Exception(__('Currency is not supported.', 'kirki-ecommerce'));
        }

        $line_items = array_map(
            function ($item) {

                $unit_price = number_format($item->total, 2, '.', '');

                return array(
                    'itemId'      => $item['item_id'],
                    'name'        => $this->limit_string_length($item->product_name, 31),
                    'description' => $this->limit_string_length($item->product_name, 255),
                    'quantity'    => floatval($item->quantity),
                    'unitPrice'   => floatval($unit_price),
                );
            },
            (array) $order->items
        );

        $billing_address  = $this->getAddress($order, 'billing');
        $shipping_address = $this->getAddress('shipping_address');

        $transaction_request = [
            'getHostedPaymentPageRequest' => [
                'merchantAuthentication' => $this->get_authentication(),
                'refId' => $order->id,
                'transactionRequest' => [
                    'transactionType' => 'authCaptureTransaction',
                    'amount' => $this->format_amount($order->total, $order->currency_code),
                    'lineItems' => $line_items,
                ]
            ]
        ];

        if (! empty($order->tax_total)) {
            $transaction_request['tax'] = array(
                'amount' => floatval($order->tax_total),
                'name'   => 'Tax',
            );
        }

        if (!empty($order->shipping_total)) {
            $transaction_request['shipping'] = array(
                'amount' => floatval($order->shipping_total),
                'name'   => 'Shipping Charge',
            );
        }

        $transaction_request['poNumber'] = $order->id;

        if (!empty($order->customer_email)) {
            $transaction_request['customer'] = array(
                'type'  => 'individual',
                'email' => $order->customer_email,
            );
        }

        try {
        } catch (Exception $e) {
            throw new Exception(__('AuthorizeNet Payment Error: ' . $e->getMessage(), 'kirki-ecommerce'));
        }
    }

    private function get_authentication()
    {
        if ($this->merchant_authentication) {
            return $this->merchant_authentication;
        }

        $this->merchant_authentication = [
            'name'           => $this->settings['login_id'],
            'transactionKey' => $this->settings['transaction_key'],
        ];

        return $this->merchant_authentication;
    }

    private function check_currency(string $currency)
    {
        $merchant_request_payload = array(
            'getMerchantDetailsRequest' => array(
                'merchantAuthentication' => $this->get_authentication(),
            ),
        );

        $response = Http::as_json()
                    ->with_body(wp_json_encode($merchant_request_payload))
                    ->post($this->get_api_url());

        if ($response->failed()) {
            throw new Exception(sprintf(__('AuthorizeNet API Error: %s', 'kirki-ecommerce'), $response->body()));
        }

        $result = $this->strip_uf8_bom($response->__toString());

        return in_array($currency, $result->currencies);
    }

    private function get_api_url()
    {
        return ($this->settings['sandbox'] ?? false) ? static::SANDBOX_API_ENDPOINT : static::PRODUCTION_API_ENDPOINT;
    }

    private function strip_uf8_bom($response_body)
    {
        // Decoding json and removing bom.
        $possible_bom  = substr($response_body, 0, 3);
        $utf_bom       = pack('CCC', 0xef, 0xbb, 0xbf);

        if (0 === strncmp($possible_bom, $utf_bom, 3)) {
            return json_decode(substr($response_body, 3));
        }

        return json_decode($response_body);
    }

    private function format_amount($amount, $currency)
    {
        return number_format(Money::from_minor($amount, $currency)->getAmount()->toFloat(), 2, '.', '');
    }

    private function limit_string_length($string, $length)
    {

        $suffix = '...';

        if (empty($string) || empty($length)) {
            return '';
        }

        if (mb_strlen($string) > $length) {
            return mb_substr($string, 0, $length - mb_strlen($suffix)) . $suffix;
        }

        return $string;
    }

    private function getAddress(Order $order, string $type): array
    {
        if (empty($type)) {
            return [];
        }

        $address                  = $type;
        [$first_name, $last_name] = $this->extractNameParts($address->name);
        [$address1]               = $this->splitAddress($address, 60);

        $return_data = [
            'firstName' => $this->limit_string_length($first_name, 50),
            'lastName'  => $this->limit_string_length($last_name, 50),
            'address'   => $address1,
            'city'      => $this->limit_string_length($address->city, 40),
            'state'     => $this->limit_string_length($address->region, 40),
            'zip'       => $this->limit_string_length($address->postal_code, 20),
            'country'   => $address->country->alpha_2 ?? '',
        ];

        if ('billing_address' === $type) {
            $return_data['phoneNumber'] = $this->limit_string_length($address->phone_number, 25) ?? '';
        }

        return $return_data;
    }

    public static function splitAddress($data, $maxLength)
    {
        if (empty($data->address1)) {
            return array();
        }

        $address_1 = mb_strimwidth($data->address1, 0, $maxLength);
        $address_2 = ( strlen($data->address1) > $maxLength ) ? mb_strimwidth($data->address1, $maxLength, $maxLength) : $data->address2;

        return array( $address_1, $address_2 );
    }
}
