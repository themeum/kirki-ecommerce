<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Constants\WooCommerceOrderStatus;
use Kirki\Ecommerce\App\Models\Coupon;

/**
 * Maps one normalized WooCommerce order to the rows Kirki saves for an order.
 *
 * Amounts are converted to minor units and arranged as Kirki defines them: item subtotals are net of
 * tax and before discounts, shipping includes its tax, and totals always include tax. The totals of
 * the source order are kept as they are and are not calculated again.
 *
 * @since 1.0.0
 */
class OrderMapper
{
    /** @var string The Kirki base currency code. */
    protected $base_currency;

    /**
     * Create the mapper.
     *
     * @since 1.0.0
     *
     * @param string $base_currency The Kirki base currency code.
     */
    public function __construct(string $base_currency)
    {
        $this->base_currency = $base_currency;
    }

    /**
     * Map an order.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $source  The normalized order from the reader.
     * @param RecordLedger                $ledger  The links between source and Kirki records.
     * @return array<string, mixed> The rows: order, customer, items, taxes, coupons, notes, refunds and report notes.
     */
    public function map(array $source, RecordLedger $ledger)
    {
        $notes = [];
        $currency = $source['currency'] !== '' ? $source['currency'] : $this->base_currency;
        $inclusive = (bool) $source['prices_include_tax'];

        $items = $this->items($source, $currency, $inclusive, $ledger, $notes);
        $shipping_lines = $this->lines_of($source, 'shipping');
        $statuses = $this->statuses($source, $notes);
        $subtotal = array_sum(array_column($items, 'subtotal'));
        $discount = (float) $source['discount_total'] + ($inclusive ? (float) $source['discount_tax'] : 0);
        $shipping = (float) $source['shipping_total'] + (float) $source['shipping_tax'];
        $tax = (float) $source['cart_tax'] + (float) $source['shipping_tax'];

        if ($currency !== $this->base_currency) {
            $notes[] = sprintf(
                /* translators: 1: order number, 2: order currency, 3: store currency */
                __('Order %1$s is in %2$s, which is not the store currency %3$s. Its base amounts were saved without exchange.', 'kirki-ecommerce'),
                $source['id'],
                $currency,
                $this->base_currency
            );
        }

        return [
            'order' => array_merge(
                $statuses,
                $this->money_fields($currency, [
                    'subtotal' => $subtotal,
                    'shipping_total' => $shipping,
                    'discount_total' => $discount,
                    'tax_total' => $tax,
                    'shipping_tax_amount' => (float) $source['shipping_tax'],
                    'total' => (float) $source['order_total'],
                ], 'order'),
                [
                    'order_number' => (string) $source['id'],
                    'currency_code' => $currency,
                    'base_currency_code' => $this->base_currency,
                    'exchange_rate' => 1,
                    'is_tax_inclusive' => $inclusive,
                    'items_count' => (int) array_sum(array_column($items, 'quantity')),
                    'payment_provider' => $source['payment_method'] !== '' ? $source['payment_method'] : null,
                    'payment_transaction_id' => $source['transaction_id'] !== '' ? $source['transaction_id'] : null,
                    'payment_metadata' => $source['payment_method_title'] !== '' ? ['title' => $source['payment_method_title'], 'source' => 'woocommerce'] : ['source' => 'woocommerce'],
                    'shipping_method' => $shipping_lines[0]['meta']['method_id'] ?? null,
                    'shipping_metadata' => !empty($shipping_lines) ? ['title' => $shipping_lines[0]['name'], 'source' => 'woocommerce'] : null,
                    'ip_address' => $source['ip_address'] !== '' ? $source['ip_address'] : null,
                    'user_agent' => $source['user_agent'] !== '' ? $source['user_agent'] : null,
                    'order_notes' => $source['customer_note'] !== '' ? $source['customer_note'] : null,
                    'customer_first_name' => $source['billing']['first_name'],
                    'customer_last_name' => $source['billing']['last_name'],
                    'customer_email' => $source['billing']['email'],
                    'customer_phone' => $source['billing']['phone'] !== '' ? $source['billing']['phone'] : null,
                ],
                $this->address_fields($source['billing'], 'billing'),
                $this->address_fields($source['shipping'], 'shipping'),
                $this->timestamps($source, $statuses)
            ),
            'customer' => [
                'user_id' => (int) $source['customer_user_id'],
                'email' => $source['billing']['email'],
                'first_name' => $source['billing']['first_name'],
                'last_name' => $source['billing']['last_name'],
                'phone' => $source['billing']['phone'],
            ],
            'items' => $items,
            'taxes' => $this->taxes($source, $currency),
            'coupons' => $this->coupons($source, $currency, $inclusive),
            'notes' => $this->activity_notes($source),
            'refunds' => $this->refunds($source, $currency),
            'notes_for_report' => $notes,
        ];
    }

    /**
     * Map the product lines and the fee lines of an order to items.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $source    The normalized order.
     * @param string               $currency  The order currency.
     * @param bool                 $inclusive Whether prices include tax.
     * @param RecordLedger                $ledger    The links between source and Kirki records.
     * @param string[]             $notes     Report notes, extended in place.
     * @return array<int, array<string, mixed>>
     */
    protected function items(array $source, string $currency, bool $inclusive, RecordLedger $ledger, array &$notes)
    {
        $items = [];
        $unlinked = 0;

        foreach ($this->lines_of($source, 'line_item') as $line) {
            $meta = $line['meta'];
            $quantity = max(1, (int) ($meta['_qty'] ?? 1));
            $subtotal = (float) ($meta['_line_subtotal'] ?? 0);
            $subtotal_tax = (float) ($meta['_line_subtotal_tax'] ?? 0);
            $total = (float) ($meta['_line_total'] ?? 0);
            $tax = (float) ($meta['_line_tax'] ?? 0);
            $product_source_id = (int) ($meta['_product_id'] ?? 0);
            $variation_source_id = (int) ($meta['_variation_id'] ?? 0);

            $variant_id = $ledger->resolve('variant', $variation_source_id > 0 ? $variation_source_id : $product_source_id);
            $product_id = $ledger->resolve('product', $product_source_id);

            if ($variant_id === null || $product_id === null) {
                $variant_id = null;
                $product_id = null;
                $unlinked++;
            }

            $unit = $subtotal / $quantity;
            $catalog_unit = ($subtotal + ($inclusive ? $subtotal_tax : 0)) / $quantity;
            $discount = ($subtotal - $total) + ($inclusive ? ($subtotal_tax - $tax) : 0);

            $items[] = array_merge(
                [
                    'product_id' => $product_id,
                    'variant_id' => $variant_id,
                    'product_name' => $line['name'],
                    'sku' => $line['sku'] ?? null,
                    'quantity' => $quantity,
                    'subtotal' => $subtotal,
                    'is_physical_product' => true,
                    'product_data' => ['source' => 'woocommerce', 'product_id' => $product_source_id, 'variation_id' => $variation_source_id],
                ],
                $this->money_fields($currency, [
                    'price' => $unit,
                    'regular_price' => $unit,
                    'regular_tax_total' => $subtotal_tax,
                    'catalog_regular_price' => $catalog_unit,
                    'catalog_sale_price' => $catalog_unit,
                    'catalog_product_coupon_discounted_subtotal' => ($catalog_unit * $quantity) - $discount,
                    'discount_tax_total' => $subtotal_tax - $tax,
                    'discount_amount' => $discount,
                    'tax_total' => $tax,
                    'subtotal' => $subtotal,
                    'total' => $total + $tax,
                ], 'item')
            );
        }

        foreach ($this->lines_of($source, 'fee') as $line) {
            $meta = $line['meta'];
            $total = (float) ($meta['_line_total'] ?? 0);
            $tax = (float) ($meta['_line_tax'] ?? 0);

            $items[] = array_merge(
                [
                    'product_id' => null,
                    'variant_id' => null,
                    'product_name' => $line['name'],
                    'sku' => null,
                    'quantity' => 1,
                    'subtotal' => $total,
                    'is_physical_product' => false,
                    'product_data' => ['source' => 'woocommerce', 'fee' => true],
                ],
                $this->money_fields($currency, [
                    'price' => $total,
                    'regular_price' => $total,
                    'regular_tax_total' => $tax,
                    'catalog_regular_price' => $total + ($inclusive ? $tax : 0),
                    'catalog_sale_price' => $total + ($inclusive ? $tax : 0),
                    'catalog_product_coupon_discounted_subtotal' => $total + ($inclusive ? $tax : 0),
                    'discount_tax_total' => 0,
                    'discount_amount' => 0,
                    'tax_total' => $tax,
                    'subtotal' => $total,
                    'total' => $total + $tax,
                ], 'item')
            );

            $notes[] = sprintf(
                /* translators: 1: order number, 2: fee name */
                __('Order %1$s: the fee "%2$s" was saved as a line item, because Kirki has no fee lines.', 'kirki-ecommerce'),
                $source['id'],
                $line['name']
            );
        }

        if ($unlinked > 0) {
            $notes[] = sprintf(
                /* translators: 1: order number, 2: number of lines */
                _n('Order %1$s: %2$d line points to a product that is not in Kirki. It was saved with the product name and SKU, without a link.', 'Order %1$s: %2$d lines point to products that are not in Kirki. They were saved with the product name and SKU, without a link.', $unlinked, 'kirki-ecommerce'),
                $source['id'],
                $unlinked
            );
        }

        return $items;
    }

    /**
     * Map the tax lines of an order to tax rows: one for the product tax and one for the shipping tax.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $source   The normalized order.
     * @param string               $currency The order currency.
     * @return array<int, array<string, mixed>>
     */
    protected function taxes(array $source, string $currency)
    {
        $taxes = [];

        foreach ($this->lines_of($source, 'tax') as $line) {
            $meta = $line['meta'];
            $name = (string) ($meta['label'] ?? $line['name']);
            $rate = (float) ($meta['rate_percent'] ?? 0);

            foreach ([['product', 'tax_amount'], ['shipping', 'shipping_tax_amount']] as [$type, $key]) {
                $amount = (float) ($meta[$key] ?? 0);

                if ($amount > 0) {
                    $taxes[] = array_merge(['type' => $type, 'name' => mb_substr($name, 0, 100), 'rate' => $rate], $this->money_fields($currency, ['amount' => $amount], 'tax'));
                }
            }
        }

        return $taxes;
    }

    /**
     * Map the coupon lines of an order, matching each to the Kirki coupon with the same code.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $source    The normalized order.
     * @param string               $currency  The order currency.
     * @param bool                 $inclusive Whether prices include tax.
     * @return array<int, array<string, mixed>>
     */
    protected function coupons(array $source, string $currency, bool $inclusive)
    {
        $coupons = [];

        foreach ($this->lines_of($source, 'coupon') as $line) {
            $discount = (float) ($line['meta']['discount_amount'] ?? 0) + ($inclusive ? (float) ($line['meta']['discount_amount_tax'] ?? 0) : 0);
            $coupon = Coupon::query()->where('code', $line['name'])->first();

            $coupons[] = array_merge(
                [
                    'coupon_id' => $coupon ? (int) $coupon->id : null,
                    'code' => $line['name'],
                    'title' => $line['name'],
                    'coupon_snapshot' => ['source' => 'woocommerce', 'code' => $line['name']],
                ],
                $this->money_fields($currency, ['discount_amount' => $discount], 'coupon')
            );
        }

        return $coupons;
    }

    /**
     * Map the order notes to activity rows.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $source The normalized order.
     * @return array<int, array<string, mixed>>
     */
    protected function activity_notes(array $source)
    {
        $notes = [];

        foreach ($source['notes'] as $note) {
            $notes[] = [
                'description' => $note['content'],
                'metadata' => ['source' => 'woocommerce', 'author' => $note['author'], 'is_customer_note' => (bool) $note['is_customer_note']],
                'created_at' => $note['date_gmt'],
            ];
        }

        return $notes;
    }

    /**
     * Map the refunds of an order.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $source   The normalized order.
     * @param string               $currency The order currency.
     * @return array<int, array<string, mixed>>
     */
    protected function refunds(array $source, string $currency)
    {
        $refunds = [];

        foreach ($source['refunds'] as $refund) {
            $amount = abs((float) $refund['amount']);

            $refunds[] = [
                'invoiced_amount' => Money::to_minor($amount, $currency),
                'reason' => $refund['reason'] !== '' ? $refund['reason'] : null,
                'refund_type' => $amount >= (float) $source['order_total'] ? 'full' : 'partial',
                'created_at' => $refund['date_gmt'],
            ];
        }

        return $refunds;
    }

    /**
     * Map the WooCommerce status to the order, payment and fulfillment statuses of Kirki.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $source The normalized order.
     * @param string[]             $notes  Report notes, extended in place.
     * @return array<string, string>
     */
    protected function statuses(array $source, array &$notes)
    {
        $paid = $source['date_paid_gmt'] !== null;

        switch ($source['status']) {
            case WooCommerceOrderStatus::PROCESSING:
                return $this->status_set(OrderStatus::PAID_UNFULFILLED, PaymentStatus::PAID, FulfillmentStatus::UNFULFILLED);
            case WooCommerceOrderStatus::ON_HOLD:
                return $this->status_set($paid ? OrderStatus::ON_HOLD_PAID : OrderStatus::ON_HOLD_UNPAID, $paid ? PaymentStatus::PAID : PaymentStatus::UNPAID, FulfillmentStatus::ON_HOLD);
            case WooCommerceOrderStatus::COMPLETED:
                return $this->status_set(OrderStatus::COMPLETED, PaymentStatus::PAID, FulfillmentStatus::DELIVERED);
            case WooCommerceOrderStatus::CANCELLED:
                return $this->status_set($paid ? OrderStatus::PAID_CANCELLED : OrderStatus::UNPAID_CANCELLED, $paid ? PaymentStatus::PAID : PaymentStatus::UNPAID, FulfillmentStatus::CANCELLED);
            case WooCommerceOrderStatus::REFUNDED:
                return $this->status_set(OrderStatus::REFUNDED, PaymentStatus::REFUNDED, FulfillmentStatus::CANCELLED);
            case WooCommerceOrderStatus::FAILED:
                return $this->status_set(OrderStatus::FAILED_UNFULFILLED, PaymentStatus::FAILED, FulfillmentStatus::UNFULFILLED);
            case WooCommerceOrderStatus::PENDING:
                return $this->status_set(OrderStatus::PENDING, PaymentStatus::UNPAID, FulfillmentStatus::UNFULFILLED);
        }

        $notes[] = sprintf(
            /* translators: 1: order number, 2: WooCommerce status */
            __('Order %1$s has the status "%2$s", which Kirki does not know. It was saved as pending.', 'kirki-ecommerce'),
            $source['id'],
            $source['status']
        );

        return $this->status_set(OrderStatus::PENDING, PaymentStatus::UNPAID, FulfillmentStatus::UNFULFILLED);
    }

    /**
     * Build the three status fields.
     *
     * @since 1.0.0
     *
     * @param string $order       The order status.
     * @param string $payment     The payment status.
     * @param string $fulfillment The fulfillment status.
     * @return array<string, string>
     */
    protected function status_set(string $order, string $payment, string $fulfillment)
    {
        return ['order_status' => $order, 'payment_status' => $payment, 'fulfillment_status' => $fulfillment];
    }

    /**
     * Get the dates that Kirki keeps for the order.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>  $source   The normalized order.
     * @param array<string, string> $statuses The mapped statuses.
     * @return array<string, string|null>
     */
    protected function timestamps(array $source, array $statuses)
    {
        $cancelled = in_array($statuses['order_status'], [OrderStatus::PAID_CANCELLED, OrderStatus::UNPAID_CANCELLED], true);

        return [
            'created_at' => $source['date_created_gmt'],
            'updated_at' => $source['date_modified_gmt'],
            'paid_at' => $source['date_paid_gmt'],
            'delivered_at' => $statuses['order_status'] === OrderStatus::COMPLETED ? ($source['date_completed_gmt'] ?? $source['date_modified_gmt']) : null,
            'cancelled_at' => $cancelled ? $source['date_modified_gmt'] : null,
        ];
    }

    /**
     * Get the lines of one type from an order.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $source The normalized order.
     * @param string               $type   The WooCommerce item type.
     * @return array<int, array<string, mixed>>
     */
    protected function lines_of(array $source, string $type)
    {
        return array_values(array_filter($source['items'], function ($item) use ($type) {
            return $item['type'] === $type;
        }));
    }

    /**
     * Build the address fields of one purpose.
     *
     * @since 1.0.0
     *
     * @param array<string, string> $address The address.
     * @param string                $purpose "billing" or "shipping".
     * @return array<string, string|null>
     */
    protected function address_fields(array $address, string $purpose)
    {
        $fields = [
            $purpose . '_first_name' => $address['first_name'],
            $purpose . '_last_name' => $address['last_name'],
            $purpose . '_company' => $address['company'] !== '' ? $address['company'] : null,
            $purpose . '_address_line1' => $address['address_1'],
            $purpose . '_address_line2' => $address['address_2'] !== '' ? $address['address_2'] : null,
            $purpose . '_city' => $address['city'],
            $purpose . '_state' => $address['state'],
            $purpose . '_country' => $address['country'],
            $purpose . '_postal_code' => $address['postcode'],
            $purpose . '_phone' => $address['phone'] !== '' ? $address['phone'] : null,
            $purpose . '_email' => $address['email'] !== '' ? $address['email'] : null,
        ];

        return $fields;
    }

    /**
     * Turn amounts into the invoiced and base minor-unit fields.
     *
     * The invoiced amount uses the order currency. The base amount uses the store currency and is not
     * exchanged, because WooCommerce keeps no exchange rate.
     *
     * @since 1.0.0
     *
     * @param string               $currency The order currency.
     * @param array<string, float> $amounts  Amounts in major units, by field name.
     * @param string               $scope    "order" keeps the name only for subtotal, "item", "tax" and "coupon" for the rows.
     * @return array<string, int>
     */
    protected function money_fields(string $currency, array $amounts, string $scope)
    {
        $fields = [];

        foreach ($amounts as $name => $amount) {
            if ($scope === 'order' && $name === 'subtotal') {
                $fields['invoiced_subtotal'] = Money::to_minor($amount, $currency);
                $fields['base_subtotal'] = Money::to_minor($amount, $this->base_currency);
                continue;
            }

            $fields['invoiced_' . $name] = Money::to_minor($amount, $currency);
            $fields['base_' . $name] = Money::to_minor($amount, $this->base_currency);
        }

        return $fields;
    }
}
