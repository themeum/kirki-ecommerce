<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds 2Checkout buy-link payment payloads.
 */
class TwocheckoutTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order to build the 2Checkout buy-link payload for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build the ConvertPlus buy-link parameters for the order.
     *
     * @return array The buy-link parameters, keyed by 2Checkout parameter name.
     *
     * @throws Exception If the order has no items.
     */
    public function built_payment_payload()
    {
        $item_details = $this->get_line_items();
        $expiration_time = absint(time() + TwocheckoutConstant::JWT_EXPIRE_TIME);

        return [
            'email' => $this->order->billing_email ?? $this->order->customer_email ?? '',
            'phone' => $this->order->billing_phone ?? '',
            'country' => $this->order->billing_country ?? '',
            'city' => $this->order->billing_city ?? '',
            'address' => $this->order->billing_address_line1 ?? '',
            'address2' => $this->order->billing_address_line2 ?? '',
            'zip' => $this->order->billing_postal_code ?? '',
            'ship-name' => trim(($this->order->shipping_first_name ?? '') . ' ' . ($this->order->shipping_last_name ?? '')),
            'ship-country' => $this->order->shipping_country ?? '',
            'ship-address' => $this->order->shipping_address_line1 ?? '',
            'ship-address2' => $this->order->shipping_address_line2 ?? '',
            'ship-zip' => $this->order->shipping_postal_code ?? '',
            'dynamic' => true,
            'prod' => $item_details['prod'],
            'item-ext-ref'  => $item_details['item-ext-ref'],
            'type' => $item_details['type'],
            'qty' => $item_details['qty'],
            'price' => $item_details['price'],
            'expiration' => $expiration_time,
            'return-url' => Url::get_checkout_success_url($this->order->uuid),
            'return-type' => 'Redirect',
            'tpl' => 'default',
            'currency' => $this->order->currency_code,
            'back-url' => Url::get_checkout_failed_url($this->order->uuid),
            'order-ext-ref' => $this->order->uuid,
            'customer-ext-ref' => $this->order->customer_id ?? $this->order->billing_email ?? '',
        ];
    }

    /**
     * Collapse the order's line items into 2Checkout's delimited parameters.
     *
     * @return array{prod: string, qty: string, price: string, item-ext-ref: string, type: string}
     *
     * @throws Exception If the order has no items.
     */
    protected function get_line_items()
    {
        if (empty($this->order->items)) {
            throw new Exception(esc_html__('No Order Items Found.', 'kirki-ecommerce-twocheckout'));
        }

        $item_names = $item_quantities = $item_prices = $item_references = $item_types = array();

        foreach ($this->order->items as $item) {
            $item_names[] = html_entity_decode($item->product_name);
            $item_quantities[] = $item->quantity;
            $item_prices[] = PaymentProvider::format_amount($item->invoiced_price, $this->order->currency_code);
            $item_references[] = $item->variant_id;
            $item_types[] = TwocheckoutConstant::TYPE_PRODUCT;
        }

        if (!empty($this->order->invoiced_tax_total)) {
            $item_names[] = TwocheckoutConstant::TAX;
            $item_quantities[] = 1;
            $item_prices[] = PaymentProvider::format_amount($this->order->invoiced_tax_total, $this->order->currency_code);
            $item_types[] = TwocheckoutConstant::TYPE_TAX;
        }

        if (!empty($this->order->invoiced_shipping_total)) {
            $item_names[] = TwocheckoutConstant::SHIPPING_CHARGE;
            $item_quantities[] = 1;
            $item_prices[] = PaymentProvider::format_amount($this->order->invoiced_shipping_total, $this->order->currency_code);
            $item_types[] = TwocheckoutConstant::TYPE_SHIPPING;
        }

        if (!empty($this->order->invoiced_discount_total)) {
            $item_names[]      = TwocheckoutConstant::DISCOUNT;
            $item_quantities[] = 1;
            $item_prices[]     = PaymentProvider::format_amount($this->order->invoiced_discount_total, $this->order->currency_code);
            $item_references[] = '';
            $item_types[]      = TwocheckoutConstant::TYPE_COUPON;
        }

        return [
            'prod' => implode(';', $item_names),
            'qty' => implode(';', $item_quantities),
            'price' => implode(';', $item_prices),
            'item-ext-ref' => implode(';', $item_references),
            'type' => implode(';', $item_types),
        ];
    }
}
