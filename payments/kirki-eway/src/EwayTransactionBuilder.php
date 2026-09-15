<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds the Eway Responsive Shared Page request payload for an order.
 */
class EwayTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order to build the Eway payload for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build the Responsive Shared Page access code request payload.
     *
     * @param string $redirect_url Where Eway sends the customer, with an AccessCode, after payment.
     * @return array The request body for AccessCodesShared.
     */
    public function build_transaction_payload(string $redirect_url): array
    {
        return [
            'Method' => EwayConstant::METHOD_PROCESS_PAYMENT,
            'TransactionType' => EwayConstant::TRANSACTION_TYPE_PURCHASE,
            'RedirectUrl' => $redirect_url,
            'CancelUrl' => Url::get_checkout_failed_url($this->order->uuid),
            'CustomerReadOnly' => true,
            'VerifyCustomerPhone' => true,
            'VerifyCustomerEmail' => true,
            'Capture' => true,
            'Customer' => $this->address('billing', $this->order->customer_first_name, $this->order->customer_last_name) + [
                'Mobile' => (string) $this->order->billing_phone,
                'Email' => (string) $this->order->billing_email,
            ],
            'ShippingAddress' => $this->address('shipping', $this->order->shipping_first_name, $this->order->shipping_last_name) + [
                'Phone' => (string) $this->order->shipping_phone,
                'Email' => (string) $this->order->shipping_email,
            ],
            'Items' => $this->line_items(),
            'Payment' => [
                'TotalAmount' => (int) $this->order->invoiced_total,
                'CurrencyCode' => $this->order->currency_code,
                'InvoiceReference' => $this->order->uuid,
            ],
        ];
    }

    /**
     * Build a customer billing or shipping address block from the order.
     *
     * @param string $type Order address prefix, "billing" or "shipping".
     * @param string|null $first_name
     * @param string|null $last_name
     * @return array
     */
    protected function address(string $type, ?string $first_name, ?string $last_name): array
    {
        [$street1, $street2] = $this->street_lines($type);

        return [
            'FirstName' => $this->truncate($first_name, EwayConstant::NAME_MAX_LENGTH),
            'LastName' => $this->truncate($last_name, EwayConstant::NAME_MAX_LENGTH),
            'Street1' => $street1,
            'Street2' => $street2,
            'City' => $this->truncate($this->order->{"{$type}_city"}, EwayConstant::FIELD_MAX_LENGTH),
            'State' => $this->truncate($this->order->{"{$type}_state"}, EwayConstant::FIELD_MAX_LENGTH),
            'PostalCode' => $this->truncate($this->order->{"{$type}_postal_code"}, EwayConstant::POSTAL_CODE_MAX_LENGTH),
            'Country' => (string) $this->order->{"{$type}_country"},
        ];
    }

    /**
     * Fit the address into Eway's two street fields.
     *
     * @param string $type Order address prefix, "billing" or "shipping".
     * @return string[]
     */
    protected function street_lines(string $type): array
    {
        $line1 = (string) $this->order->{"{$type}_address_line1"};
        $line2 = (string) $this->order->{"{$type}_address_line2"};

        if (mb_strlen($line1) > EwayConstant::FIELD_MAX_LENGTH) {
            $line2 = mb_substr($line1, EwayConstant::FIELD_MAX_LENGTH);
        }

        return [
            mb_substr($line1, 0, EwayConstant::FIELD_MAX_LENGTH),
            mb_substr($line2, 0, EwayConstant::FIELD_MAX_LENGTH),
        ];
    }

    /**
     * Shorten a string to fit an Eway field, appending an ellipsis when cut.
     *
     * @param string|null $value      The value to shorten. Null becomes an empty string.
     * @param int         $max_length The maximum length, inclusive of the ellipsis.
     * @return string
     */
    protected function truncate(?string $value, int $max_length): string
    {
        $value = (string) $value;

        if (mb_strlen($value) <= $max_length) {
            return $value;
        }

        return mb_substr($value, 0, $max_length - 3) . '...';
    }

    /**
     * Build the `Items` array for the transaction payload.
     *
     * @return array<int, array<string, mixed>> Eway line items, empty if the order has none.
     */
    protected function line_items(): array
    {
        $line_items = [];

        foreach ($this->order->items as $item) {
            $line_items[] = [
                'Description' => $item->product_name,
                'Quantity' => (int) $item->quantity,
                'UnitCost' => (int) $item->invoiced_price,
                'Tax' => (int) $item->invoiced_tax_total,
                'Total' => (int) $item->invoiced_total,
            ];
        }

        if (!empty($this->order->invoiced_shipping_total)) {
            $line_items[] = [
                'Description' => __('Shipping (Incl. any tax)', 'kirki-ecommerce-eway'),
                'Quantity' => 1,
                'UnitCost' => (int) $this->order->invoiced_shipping_total,
                'Total' => (int) $this->order->invoiced_shipping_total,
            ];
        }

        return $line_items;
    }
}
