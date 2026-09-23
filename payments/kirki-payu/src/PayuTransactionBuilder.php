<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Sanitizer;

defined('ABSPATH') || exit;

/**
 * Builds the PayU order payload for a local order.
 */
class PayuTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The local order being paid.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build the payload for PayU's order creation endpoint.
     *
     * @return array
     */
    public function build_order_payload(): array
    {
        return [
            'continueUrl' => Url::get_checkout_success_url($this->order->uuid),
            'customerIp' => $this->order->ip_address ?: $this->resolve_customer_ip(),
            'description' => '#' . $this->order->order_number . ' ' . get_bloginfo('name'),
            'extOrderId' => $this->order->uuid,
            'currencyCode' => strtoupper($this->order->currency_code),
            'totalAmount' => (string) $this->order->invoiced_total,
            'buyer' => $this->build_buyer(),
            'products' => $this->build_products(),
        ];
    }

    /**
     * Build PayU's products list from the order's items, shipping, and tax.
     *
     * @return array
     */
    protected function build_products(): array
    {
        $products = [];

        foreach ($this->order->items as $item) {
            $products[] = $this->make_product($item->product_name, (string) $item->invoiced_price, (string) $item->quantity);
        }

        if (!empty($this->order->invoiced_shipping_total)) {
            $products[] = $this->make_product(
                __('Shipping Charge', 'kirki-ecommerce-payu'),
                (string) $this->order->invoiced_shipping_total
            );
        }

        if (!empty($this->order->invoiced_tax_total)) {
            $tax_without_shipping = $this->order->invoiced_tax_total - ($this->order->invoiced_shipping_tax_amount ?? 0);
            $products[] = $this->make_product(__('Tax', 'kirki-ecommerce-payu'), (string) $tax_without_shipping);
        }

        return $products;
    }

    /**
     * Build a single PayU product entry.
     *
     * @param string $name The line item's label.
     * @param string $unit_price The price in minor units.
     * @param string $quantity The number of units.
     * @return array
     */
    protected function make_product(string $name, string $unit_price, string $quantity = '1'): array
    {
        return [
            'name' => $name,
            'unitPrice' => $unit_price,
            'quantity' => $quantity,
        ];
    }

    /**
     * Build PayU's buyer object from the order's billing and shipping details.
     *
     * @return array
     */
    protected function build_buyer(): array
    {
        return [
            'email' => $this->order->billing_email ?? $this->order->customer_email,
            'phone' => $this->order->billing_phone,
            'firstName' => $this->order->billing_first_name,
            'lastName' => $this->order->billing_last_name,
            'delivery' => [
                'street' => $this->order->shipping_address_line1,
                'postalBox' => $this->order->shipping_address_line2,
                'postalCode' => $this->order->shipping_postal_code,
                'city' => $this->order->shipping_city,
                'state' => $this->order->shipping_state,
                'countryCode' => $this->order->shipping_country,
                'recipientName' => $this->order->shipping_first_name,
                'recipientPhone' => $this->order->shipping_phone,
                'recipientEmail' => $this->order->shipping_email ?? $this->order->customer_email,
            ],
        ];
    }

    /**
     * Resolve the customer's IP address from the request headers.
     *
     * @return string Empty when no usable address is present.
     */
    protected function resolve_customer_ip(): string
    {
        foreach (PayuConstant::CLIENT_IP_HEADERS as $header) {
            $value = Superglobals::server($header, '');

            if (empty($value)) {
                continue;
            }

            // A forwarding header can carry a comma-separated chain; the first entry
            // is the original client. It can't be trusted for authenticity, but PayU
            // only uses it for risk scoring.
            $address = trim(explode(',', $value)[0]);

            if (filter_var($address, FILTER_VALIDATE_IP)) {
                return $address;
            }
        }

        return '';
    }
}
