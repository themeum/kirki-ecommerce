<?php

namespace Kirki\Ecommerce\Database\Seeders;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderTaxType;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\Facades\Order;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order as OrderModel;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\OrderTax;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Supports\OrderNumberGenerator;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

use function Kirki\Ecommerce\Framework\uuid;

/**
 * Seeds a sample manual order for the last seeded customer, then a history of orders for the Analytics page.
 *
 * @since 1.0.0
 */
class OrderSeeder extends Seeder
{
    /**
     * Number of days of order history, counted back from today. Five years, so long ranges and
     * year-over-year comparisons have data, and the Analytics queries run on a large table.
     */
    const HISTORY_DAYS = 1826;

    /**
     * Rows per INSERT statement.
     */
    const INSERT_CHUNK = 200;

    /**
     * Number of built orders to keep in memory before they are inserted.
     */
    const FLUSH_ORDERS = 2000;

    /**
     * Fixed random seed, so every run gives the same mix of orders.
     */
    const RANDOM_SEED = 20261018;

    /** @var array<int, array<string, mixed>> Sellable variants with their product data. */
    protected $catalog = [];

    /** @var array<string, int> Coupon IDs keyed by code. */
    protected $coupon_ids = [];

    /** @var array<int, array<string, mixed>> Shoppers, in the order of their first purchase. */
    protected $shoppers = [];

    /** @var array<string, int> Number of orders built so far, keyed by shopper email. */
    protected $order_counts = [];

    /** @var int Next free customer ID. */
    protected $next_customer_id = 1;

    /** @var array<string, array<int, array<string, mixed>>> Rows to insert, keyed by table. */
    protected $rows = [
        'customers' => [],
        'orders' => [],
        'order_items' => [],
        'order_coupons' => [],
        'order_taxes' => [],
        'refunds' => [],
    ];

    /**
     * Seed a sample order linked to catalog products and coupons, then the order history.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        $customer = SeedCatalog::get_customers()[9];
        $products = SeedCatalog::get_products();

        $data = CreateOrderPayloadDTO::from_array([
            'items' => [
                [
                    'variant_id' => 1,
                    'quantity' => 1,
                ],
                [
                    'variant_id' => 7,
                    'quantity' => 1,
                ],
            ],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'coupon_codes' => ['WINTER20'],
            'shipping_method' => 'method-0001',
            'shipping_first_name' => $customer['first_name'],
            'shipping_last_name' => $customer['last_name'],
            'shipping_address_line1' => 'House 12, Road 5, Block C',
            'shipping_address_line2' => 'Banani',
            'shipping_city' => 'Dhaka',
            'shipping_state' => '771',
            'shipping_postal_code' => '1213',
            'shipping_country' => 'BD',
            'shipping_phone' => $customer['phone'],
            'shipping_email' => $customer['email'],
            'shipping_company' => null,
            'billing_first_name' => $customer['first_name'],
            'billing_last_name' => $customer['last_name'],
            'billing_address_line1' => 'House 12, Road 5, Block C',
            'billing_address_line2' => 'Banani',
            'billing_city' => 'Dhaka',
            'billing_state' => '771',
            'billing_postal_code' => '1213',
            'billing_country' => 'BD',
            'billing_phone' => $customer['phone'],
            'billing_email' => $customer['email'],
            'billing_company' => null,
            'customer_first_name' => $customer['first_name'],
            'customer_last_name' => $customer['last_name'],
            'customer_email' => $customer['email'],
            'customer_phone' => $customer['phone'],
            'order_notes' => 'Please deliver between 10 AM and 6 PM. Order includes '
                . $products[0]['title'] . ' and ' . $products[1]['title'] . '.',
            'customer_id' => 10,
            'is_manual' => 1,
        ]);

        Order::create($data);

        $this->seed_order_history();

        Log::info('OrderSeeder run successfully');
    }

    /**
     * Seed about five years of orders (more than 20,000) for the Analytics page.
     *
     * The orders are written straight to the order tables with backdated timestamps, so stock,
     * coupon usage counts, emails and order activities stay as they are. The totals follow the
     * same rules as a checkout: item tax on the discounted line, shipping tax on taxable methods,
     * free-shipping coupons that remove the shipping fee, and invoiced amounts converted from the
     * base amounts for EUR and GBP orders.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function seed_order_history()
    {
        $this->catalog = $this->load_catalog();

        if (empty($this->catalog)) {
            Log::info('OrderSeeder skipped the order history: no sellable variants');
            return;
        }

        mt_srand(static::RANDOM_SEED);

        $this->coupon_ids = $this->load_coupon_ids();
        $this->shoppers = $this->load_seeded_shoppers();
        $this->next_customer_id = (int) Customer::query()->max('id') + 1;

        $order_id = (int) OrderModel::query()->max('id') + 1;
        $first_order_id = $order_id;
        $now = time();
        $first_day = strtotime(gmdate('Y-m-d', $now) . ' 00:00:00 UTC') - static::HISTORY_DAYS * DAY_IN_SECONDS;

        for ($day = 0; $day <= static::HISTORY_DAYS; $day++) {
            $day_start = $first_day + $day * DAY_IN_SECONDS;
            $times = [];

            for ($index = $this->orders_on_day($day, $day_start); $index > 0; $index--) {
                $time = $day_start + mt_rand(0, DAY_IN_SECONDS - 1);

                if ($time < $now - MINUTE_IN_SECONDS) {
                    $times[] = $time;
                }
            }

            sort($times);

            foreach ($times as $time) {
                $this->build_order($order_id++, $time, $now);
            }

            if (count($this->rows['orders']) >= static::FLUSH_ORDERS) {
                $this->insert_rows();
            }
        }

        $this->insert_rows();

        Log::info(sprintf('OrderSeeder added %d history orders', $order_id - $first_order_id));
    }

    /**
     * Get the number of orders for one day: a growing trend with weekly and yearly seasons.
     *
     * @since 1.0.0
     *
     * @param int $day       Day number, 0 for the first day of the history.
     * @param int $day_start Start of the day, as a UTC timestamp.
     *
     * @return int
     */
    protected function orders_on_day(int $day, int $day_start)
    {
        $month_factors = [1 => 0.8, 0.8, 0.95, 1.0, 1.0, 0.9, 0.9, 0.95, 1.05, 1.1, 1.45, 1.7];
        $weekday_factors = [1.2, 0.9, 0.95, 0.95, 1.0, 1.1, 1.3];

        $trend = 3 + 20 * ($day / static::HISTORY_DAYS);
        $rate = $trend
            * $month_factors[(int) gmdate('n', $day_start)]
            * $weekday_factors[(int) gmdate('w', $day_start)];

        return max(0, (int) round($rate * (0.6 + $this->chance() * 0.8)));
    }

    /**
     * Build one order with its items, coupon, taxes and refund.
     *
     * @since 1.0.0
     *
     * @param int $order_id Order ID.
     * @param int $time     Time the order was placed, as a UTC timestamp.
     * @param int $now      Current time, as a UTC timestamp.
     *
     * @return void
     */
    protected function build_order(int $order_id, int $time, int $now)
    {
        $shopper = $this->pick_shopper($time);
        $region = $shopper['region'];
        $currency = $this->pick_currency($region);
        $method = $this->pick_weighted($this->get_shipping_methods());
        $provider = $this->pick_weighted($this->get_payment_providers());
        $coupon = $this->pick_coupon(empty($this->order_counts[$shopper['email']]));
        $this->order_counts[$shopper['email']] = ($this->order_counts[$shopper['email']] ?? 0) + 1;
        $age_days = ($now - $time) / DAY_IN_SECONDS;

        $items = $this->build_items($order_id, $time, $currency, $region, $coupon);
        $subtotal = array_sum(array_column($items, 'base_subtotal'));
        $item_discount = array_sum(array_column($items, 'base_discount_amount'));
        $item_tax = array_sum(array_column($items, 'base_tax_total'));

        $shipping_fee = $method['base_amount'] + ($method['id'] === 'method-0003' ? 500 * min(count($items), 4) : 0);
        $shipping_discount = 0;

        if ($coupon !== null && $coupon['discount_type'] === 'free-shipping') {
            $shipping_discount = $shipping_fee;
        }

        $shipping = $shipping_fee - $shipping_discount;
        $shipping_tax = $method['is_taxable'] && $region['shipping_taxable'] ? $this->percent_of($shipping, $region['tax_rate']) : 0;
        $total = $subtotal - $item_discount + $item_tax + $shipping + $shipping_tax;

        [$payment_status, $fulfillment_status, $paid_at] = $this->pick_statuses($provider, $time, $age_days, $now);
        $order_status = $this->resolve_order_status($payment_status, $fulfillment_status);

        $amounts = [
            'subtotal' => $subtotal,
            'shipping_total' => $shipping + $shipping_tax,
            'discount_total' => $item_discount + $shipping_discount,
            'tax_total' => $item_tax + $shipping_tax,
            'shipping_tax_amount' => $shipping_tax,
            'total' => $total,
        ];

        $order = [
            'id' => $order_id,
            'uuid' => uuid(),
            'order_number' => OrderNumberGenerator::generate_order_number($order_id),
            'customer_id' => $shopper['customer_id'],
            'order_status' => $order_status,
            'fulfillment_status' => $fulfillment_status,
            'is_refund_initiated' => 0,
            'currency_code' => $currency['code'],
            'base_currency_code' => 'USD',
            'exchange_rate' => $currency['rate'],
            'items_count' => array_sum(array_column($items, 'quantity')),
            'payment_status' => $payment_status,
            'payment_provider' => $provider['id'],
            'payment_transaction_id' => $payment_status === PaymentStatus::FAILED ? null : 'txn_seed_' . $order_id,
            'payment_metadata' => wp_json_encode(['payment_provider' => ['id' => $provider['id'], 'name' => $provider['name'], 'is_offline' => $provider['id'] === 'cod']]),
            'shipping_method' => $method['id'],
            'shipping_metadata' => wp_json_encode(['shipping_method' => ['id' => $method['id'], 'name' => $method['name'], 'type' => $method['type']]]),
            'shipping_first_name' => $shopper['first_name'],
            'shipping_last_name' => $shopper['last_name'],
            'shipping_address_line1' => $shopper['address_line1'],
            'shipping_city' => $region['city'],
            'shipping_state' => $region['state'],
            'shipping_country' => $region['country'],
            'shipping_postal_code' => $region['postal_code'],
            'shipping_phone' => $shopper['phone'],
            'shipping_email' => $shopper['email'],
            'is_billing_same_as_shipping' => 1,
            'billing_first_name' => $shopper['first_name'],
            'billing_last_name' => $shopper['last_name'],
            'billing_address_line1' => $shopper['address_line1'],
            'billing_city' => $region['city'],
            'billing_state' => $region['state'],
            'billing_country' => $region['country'],
            'billing_postal_code' => $region['postal_code'],
            'billing_phone' => $shopper['phone'],
            'billing_email' => $shopper['email'],
            'customer_first_name' => $shopper['first_name'],
            'customer_last_name' => $shopper['last_name'],
            'customer_email' => $shopper['email'],
            'customer_phone' => $shopper['phone'],
            'paid_at' => $paid_at === null ? null : gmdate('Y-m-d H:i:s', $paid_at),
            'shipped_at' => null,
            'delivered_at' => null,
            'cancelled_at' => null,
            'created_at' => gmdate('Y-m-d H:i:s', $time),
            'updated_at' => gmdate('Y-m-d H:i:s', $paid_at ?? $time),
        ];

        foreach ($amounts as $column => $amount) {
            $order['base_' . $column] = $amount;
            $order['invoiced_' . $column] = $this->convert($amount, $currency);
        }

        $this->add_fulfillment_dates($order, $fulfillment_status, $time, $now);

        if ($coupon !== null) {
            $this->add_order_coupon($order, $coupon, $item_discount + $shipping_discount, $currency, $shopper['customer_id']);
        }

        $this->add_order_taxes($order, $region, $item_tax, $shipping_tax, $currency);
        $this->maybe_add_refund($order, $paid_at, $now);

        $this->rows['orders'][] = $order;
        array_push($this->rows['order_items'], ...$items);
    }

    /**
     * Build the items of an order. A coupon discount is added to the items it applies to.
     *
     * @since 1.0.0
     *
     * @param int                       $order_id Order ID.
     * @param int                       $time     Time the order was placed, as a UTC timestamp.
     * @param array<string, mixed>      $currency Order currency.
     * @param array<string, mixed>      $region   Shipping region.
     * @param array<string, mixed>|null $coupon   Coupon used, or null.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_items(int $order_id, int $time, array $currency, array $region, $coupon)
    {
        $line_count = $this->pick_weighted([['value' => 1, 'weight' => 55], ['value' => 2, 'weight' => 28], ['value' => 3, 'weight' => 12], ['value' => 4, 'weight' => 5]])['value'];
        $variants = [];

        while (count($variants) < min($line_count, count($this->catalog))) {
            $variant = $this->pick_weighted($this->catalog);
            $variants[$variant['id']] = $variant;
        }

        $lines = [];

        foreach ($variants as $variant) {
            $quantity = $this->pick_weighted([['value' => 1, 'weight' => 80], ['value' => 2, 'weight' => 15], ['value' => 3, 'weight' => 5]])['value'];
            $lines[] = ['variant' => $variant, 'quantity' => $quantity, 'subtotal' => $variant['price'] * $quantity, 'discount' => 0];
        }

        $this->apply_coupon_to_lines($lines, $coupon);

        $items = [];
        $timestamp = gmdate('Y-m-d H:i:s', $time);

        foreach ($lines as $line) {
            $variant = $line['variant'];
            $tax = $variant['charge_taxes'] ? $this->percent_of($line['subtotal'] - $line['discount'], $region['tax_rate']) : 0;
            $base = [
                'price' => $variant['price'],
                'regular_price' => $variant['regular_price'],
                'catalog_regular_price' => $variant['regular_price'],
                'catalog_sale_price' => $variant['price'],
                'catalog_product_coupon_discounted_subtotal' => $line['subtotal'] - $line['discount'],
                'subtotal' => $line['subtotal'],
                'discount_amount' => $line['discount'],
                'tax_total' => $tax,
                'total' => $line['subtotal'] - $line['discount'] + $tax,
            ];

            $item = [
                'order_id' => $order_id,
                'product_id' => $variant['product_id'],
                'variant_id' => $variant['id'],
                'product_name' => $variant['title'],
                'sku' => $variant['sku'],
                'product_image' => $variant['media'],
                'quantity' => $line['quantity'],
                'is_physical_product' => 1,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];

            foreach ($base as $column => $amount) {
                $item['base_' . $column] = $amount;
                $item['invoiced_' . $column] = $this->convert($amount, $currency);
            }

            $items[] = $item;
        }

        return $items;
    }

    /**
     * Spread a coupon's discount over the order lines.
     *
     * Order coupons discount every line. Product coupons discount the most expensive line only.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $lines  Order lines, changed in place.
     * @param array<string, mixed>|null        $coupon Coupon used, or null.
     *
     * @return void
     */
    protected function apply_coupon_to_lines(array &$lines, $coupon)
    {
        if ($coupon === null || $coupon['discount_type'] === 'free-shipping') {
            return;
        }

        if ($coupon['discount_target'] === 'order') {
            foreach ($lines as $index => $line) {
                $lines[$index]['discount'] = $this->percent_of($line['subtotal'], $coupon['percentage']);
            }

            return;
        }

        usort($lines, function ($first, $second) {
            return $second['subtotal'] <=> $first['subtotal'];
        });

        $lines[0]['discount'] = $coupon['fixed'] !== null
            ? min($coupon['fixed'], $lines[0]['subtotal'])
            : $this->percent_of($lines[0]['subtotal'], $coupon['percentage']);
    }

    /**
     * Pick the payment status, the fulfillment status and the payment time of an order.
     *
     * Older orders are mostly delivered; recent orders are still in progress. Cash on delivery
     * orders are paid when they are delivered.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $provider Payment provider.
     * @param int                  $time     Time the order was placed, as a UTC timestamp.
     * @param float                $age_days Age of the order in days.
     * @param int                  $now      Current time, as a UTC timestamp.
     *
     * @return array{0: string, 1: string, 2: int|null}
     */
    protected function pick_statuses(array $provider, int $time, float $age_days, int $now)
    {
        if ($this->chance() < 0.03) {
            return [PaymentStatus::FAILED, FulfillmentStatus::UNFULFILLED, null];
        }

        if ($age_days < 2) {
            $fulfillment = $this->pick_weighted([
                ['value' => FulfillmentStatus::UNFULFILLED, 'weight' => 60],
                ['value' => FulfillmentStatus::PROCESSING, 'weight' => 34],
                ['value' => FulfillmentStatus::ON_HOLD, 'weight' => 6],
            ])['value'];
        } elseif ($age_days < 7) {
            $fulfillment = $this->pick_weighted([
                ['value' => FulfillmentStatus::PROCESSING, 'weight' => 25],
                ['value' => FulfillmentStatus::SHIPPED, 'weight' => 52],
                ['value' => FulfillmentStatus::DELIVERED, 'weight' => 15],
                ['value' => FulfillmentStatus::ON_HOLD, 'weight' => 5],
                ['value' => FulfillmentStatus::CANCELLED, 'weight' => 3],
            ])['value'];
        } else {
            $fulfillment = $this->pick_weighted([
                ['value' => FulfillmentStatus::DELIVERED, 'weight' => 88],
                ['value' => FulfillmentStatus::SHIPPED, 'weight' => 3],
                ['value' => FulfillmentStatus::ON_HOLD, 'weight' => 1],
                ['value' => FulfillmentStatus::CANCELLED, 'weight' => 5],
                ['value' => FulfillmentStatus::RETURNED, 'weight' => 3],
            ])['value'];
        }

        if ($fulfillment === FulfillmentStatus::CANCELLED) {
            return [PaymentStatus::UNPAID, $fulfillment, null];
        }

        if ($provider['id'] === 'cod') {
            $is_delivered = in_array($fulfillment, [FulfillmentStatus::DELIVERED, FulfillmentStatus::RETURNED], true);
            $paid_at = min($now - MINUTE_IN_SECONDS, $time + mt_rand(2, 5) * DAY_IN_SECONDS + mt_rand(0, 8 * HOUR_IN_SECONDS));

            return $is_delivered ? [PaymentStatus::PAID, $fulfillment, $paid_at] : [PaymentStatus::UNPAID, $fulfillment, null];
        }

        return [PaymentStatus::PAID, $fulfillment, min($now - MINUTE_IN_SECONDS, $time + mt_rand(30, 1800))];
    }

    /**
     * Get the order status for a payment status and a fulfillment status.
     *
     * @since 1.0.0
     *
     * @param string $payment_status     Payment status.
     * @param string $fulfillment_status Fulfillment status.
     *
     * @return string
     */
    protected function resolve_order_status(string $payment_status, string $fulfillment_status)
    {
        if ($payment_status === PaymentStatus::FAILED) {
            return OrderStatus::FAILED_UNFULFILLED;
        }

        $statuses = [
            PaymentStatus::PAID => [
                FulfillmentStatus::UNFULFILLED => OrderStatus::PAID_UNFULFILLED,
                FulfillmentStatus::PROCESSING => OrderStatus::PAID_PROCESSING,
                FulfillmentStatus::SHIPPED => OrderStatus::PAID_SHIPPED,
                FulfillmentStatus::DELIVERED => OrderStatus::COMPLETED,
                FulfillmentStatus::ON_HOLD => OrderStatus::ON_HOLD_PAID,
                FulfillmentStatus::RETURNED => OrderStatus::REFUNDED,
            ],
            PaymentStatus::UNPAID => [
                FulfillmentStatus::UNFULFILLED => OrderStatus::PENDING,
                FulfillmentStatus::PROCESSING => OrderStatus::UNPAID_PROCESSING,
                FulfillmentStatus::SHIPPED => OrderStatus::SHIPPED_UNPAID,
                FulfillmentStatus::DELIVERED => OrderStatus::DELIVERED_UNPAID,
                FulfillmentStatus::ON_HOLD => OrderStatus::ON_HOLD_UNPAID,
                FulfillmentStatus::CANCELLED => OrderStatus::UNPAID_CANCELLED,
            ],
        ];

        return $statuses[$payment_status][$fulfillment_status] ?? OrderStatus::PENDING;
    }

    /**
     * Set the shipped, delivered and cancelled times of an order from its fulfillment status.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $order              Order row, changed in place.
     * @param string               $fulfillment_status Fulfillment status.
     * @param int                  $time               Time the order was placed, as a UTC timestamp.
     * @param int                  $now                Current time, as a UTC timestamp.
     *
     * @return void
     */
    protected function add_fulfillment_dates(array &$order, string $fulfillment_status, int $time, int $now)
    {
        $shipped_at = min($now, $time + mt_rand(1, 2) * DAY_IN_SECONDS);
        $delivered_at = min($now, $shipped_at + mt_rand(1, 4) * DAY_IN_SECONDS);

        if (in_array($fulfillment_status, [FulfillmentStatus::SHIPPED, FulfillmentStatus::DELIVERED, FulfillmentStatus::RETURNED], true)) {
            $order['shipped_at'] = gmdate('Y-m-d H:i:s', $shipped_at);
        }

        if (in_array($fulfillment_status, [FulfillmentStatus::DELIVERED, FulfillmentStatus::RETURNED], true)) {
            $order['delivered_at'] = gmdate('Y-m-d H:i:s', $delivered_at);
        }

        if ($fulfillment_status === FulfillmentStatus::CANCELLED) {
            $order['cancelled_at'] = gmdate('Y-m-d H:i:s', min($now, $time + mt_rand(1, 20) * HOUR_IN_SECONDS));
        }
    }

    /**
     * Add the coupon row of an order.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $order       Order row.
     * @param array<string, mixed> $coupon      Coupon used.
     * @param int                  $discount    Discount the coupon gave, in base minor units.
     * @param array<string, mixed> $currency    Order currency.
     * @param int|null             $customer_id Customer ID, or null for a guest.
     *
     * @return void
     */
    protected function add_order_coupon(array $order, array $coupon, int $discount, array $currency, $customer_id)
    {
        $this->rows['order_coupons'][] = [
            'order_id' => $order['id'],
            'coupon_id' => $this->coupon_ids[$coupon['code']] ?? null,
            'customer_id' => $customer_id,
            'code' => $coupon['code'],
            'title' => $coupon['title'],
            'discount_type' => $coupon['discount_type'],
            'discount_target' => $coupon['discount_target'],
            'base_discount_amount' => $discount,
            'invoiced_discount_amount' => $this->convert($discount, $currency),
            'usage_reversed_at' => $order['fulfillment_status'] === FulfillmentStatus::CANCELLED ? $order['cancelled_at'] : null,
            'created_at' => $order['created_at'],
            'updated_at' => $order['created_at'],
        ];
    }

    /**
     * Add the product tax and shipping tax rows of an order.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $order        Order row.
     * @param array<string, mixed> $region       Shipping region.
     * @param int                  $item_tax     Product tax, in base minor units.
     * @param int                  $shipping_tax Shipping tax, in base minor units.
     * @param array<string, mixed> $currency     Order currency.
     *
     * @return void
     */
    protected function add_order_taxes(array $order, array $region, int $item_tax, int $shipping_tax, array $currency)
    {
        $taxes = [OrderTaxType::PRODUCT => $item_tax, OrderTaxType::SHIPPING => $shipping_tax];

        foreach ($taxes as $type => $amount) {
            if ($amount <= 0) {
                continue;
            }

            $this->rows['order_taxes'][] = [
                'order_id' => $order['id'],
                'order_item_id' => null,
                'type' => $type,
                'name' => $region['tax_name'],
                'rate' => $region['tax_rate'],
                'base_amount' => $amount,
                'invoiced_amount' => $this->convert($amount, $currency),
                'created_at' => $order['created_at'],
                'updated_at' => $order['created_at'],
            ];
        }
    }

    /**
     * Add a refund to some paid orders: a full refund to every returned order, a partial refund to a
     * few delivered orders, and a pending refund to a few more.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $order   Order row, changed in place.
     * @param int|null             $paid_at Payment time, as a UTC timestamp, or null when not paid.
     * @param int                  $now     Current time, as a UTC timestamp.
     *
     * @return void
     */
    protected function maybe_add_refund(array &$order, $paid_at, int $now)
    {
        if ($paid_at === null) {
            return;
        }

        $is_returned = $order['fulfillment_status'] === FulfillmentStatus::RETURNED;
        $roll = $this->chance();

        if (!$is_returned && ($order['fulfillment_status'] !== FulfillmentStatus::DELIVERED || $roll >= 0.06)) {
            return;
        }

        $refunded_at = min($now - MINUTE_IN_SECONDS, $paid_at + mt_rand(4, 25) * DAY_IN_SECONDS);
        $is_pending = !$is_returned && $roll < 0.01;
        $is_full = $is_returned || $roll < 0.02;
        $amount = $is_full ? $order['invoiced_total'] : (int) round($order['invoiced_total'] * mt_rand(15, 60) / 100);

        $order['is_refund_initiated'] = 1;

        if ($is_pending) {
            $order['payment_status'] = PaymentStatus::REFUNDING;
            $order['order_status'] = OrderStatus::REFUND_IN_PROGRESS;
        } elseif ($is_full) {
            $order['payment_status'] = PaymentStatus::REFUNDED;
            $order['order_status'] = OrderStatus::REFUNDED;
        } else {
            $order['order_status'] = OrderStatus::REFUNDED_PARTIALLY;
        }

        $this->rows['refunds'][] = [
            'order_id' => $order['id'],
            'status' => $is_pending ? RefundStatus::PENDING : RefundStatus::COMPLETED,
            'invoiced_amount' => $amount,
            'reason' => $is_returned ? 'Customer returned the items.' : 'Item arrived damaged.',
            'refund_type' => $is_full ? 'full' : 'partial',
            'refund_id' => 're_seed_' . $order['id'],
            'created_at' => gmdate('Y-m-d H:i:s', $refunded_at),
            'updated_at' => gmdate('Y-m-d H:i:s', $refunded_at),
        ];
    }

    /**
     * Pick the shopper of an order: a new shopper, or a returning one, with loyal shoppers more likely.
     *
     * About half of the new shoppers register a customer account; the others check out as guests.
     *
     * @since 1.0.0
     *
     * @param int $time Time the order was placed, as a UTC timestamp.
     *
     * @return array<string, mixed>
     */
    protected function pick_shopper(int $time)
    {
        $count = count($this->shoppers);

        if ($count > 0 && $this->chance() >= 0.42) {
            return $this->shoppers[(int) floor(pow($this->chance(), 2.2) * $count)];
        }

        $first_names = ['Liam', 'Noah', 'Emma', 'Ava', 'Mia', 'Lucas', 'Ethan', 'Zara', 'Nadia', 'Omar', 'Hana', 'Ravi', 'Lena', 'Marco', 'Chloe', 'Ivan', 'Sara', 'Yuki', 'Tariq', 'Elena'];
        $last_names = ['Smith', 'Garcia', 'Nguyen', 'Khan', 'Muller', 'Rossi', 'Silva', 'Haddad', 'Lee', 'Novak', 'Okafor', 'Rahman', 'Schmidt', 'Dubois', 'Ali', 'Kowalski'];
        $first_name = $first_names[mt_rand(0, count($first_names) - 1)];
        $last_name = $last_names[mt_rand(0, count($last_names) - 1)];
        $email = strtolower($first_name . '.' . $last_name . '.' . ($count + 1)) . '@example.com';
        $customer_id = null;

        if ($this->chance() < 0.5) {
            $customer_id = $this->next_customer_id++;
            $timestamp = gmdate('Y-m-d H:i:s', $time);
            $this->rows['customers'][] = [
                'id' => $customer_id,
                'first_name' => $first_name,
                'last_name' => $last_name,
                'email' => $email,
                'phone' => '+1555' . str_pad((string) mt_rand(0, 9999999), 7, '0', STR_PAD_LEFT),
                'accepts_marketing' => mt_rand(0, 1),
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        $shopper = [
            'customer_id' => $customer_id,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'email' => $email,
            'phone' => '+1555' . str_pad((string) mt_rand(0, 9999999), 7, '0', STR_PAD_LEFT),
            'address_line1' => mt_rand(10, 9999) . ' Market Street',
            'region' => $this->pick_weighted($this->get_regions()),
        ];

        $this->shoppers[] = $shopper;

        return $shopper;
    }

    /**
     * Pick the coupon of an order, or null for none. WELCOME10 is only for a first order.
     *
     * @since 1.0.0
     *
     * @param bool $is_first_order Whether this is the shopper's first order.
     *
     * @return array<string, mixed>|null
     */
    protected function pick_coupon(bool $is_first_order)
    {
        if ($this->chance() >= 0.3) {
            return null;
        }

        $coupon = $this->pick_weighted($this->get_coupons());

        return $coupon['code'] === 'WELCOME10' && !$is_first_order ? null : $coupon;
    }

    /**
     * Pick the currency of an order: most UK orders are in GBP and most German orders in EUR.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $region Shipping region.
     *
     * @return array<string, mixed>
     */
    protected function pick_currency(array $region)
    {
        $currencies = [
            'USD' => ['code' => 'USD', 'rate' => 1],
            'EUR' => ['code' => 'EUR', 'rate' => 0.92],
            'GBP' => ['code' => 'GBP', 'rate' => 0.79],
        ];

        if ($region['currency'] !== 'USD' && $this->chance() < 0.75) {
            return $currencies[$region['currency']];
        }

        return $currencies['USD'];
    }

    /**
     * Load the sellable variants with their product title, price and a popularity weight.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function load_catalog()
    {
        $titles = [];

        foreach (Product::query()->get() as $product) {
            $titles[$product->id] = $product->title;
        }

        $catalog = [];

        foreach (Variant::query()->get() as $variant) {
            $price = (int) ($variant->base_sale_price ?: $variant->base_price);

            if ($price <= 0 || !isset($titles[$variant->product_id])) {
                continue;
            }

            $catalog[] = [
                'id' => (int) $variant->id,
                'product_id' => (int) $variant->product_id,
                'title' => $titles[$variant->product_id],
                'sku' => $variant->sku,
                'media' => $variant->media,
                'price' => $price,
                'regular_price' => (int) $variant->base_price,
                'charge_taxes' => (bool) $variant->charge_taxes,
                'weight' => 1 + ((int) $variant->product_id * 7) % 10,
            ];
        }

        return $catalog;
    }

    /**
     * Load the coupon IDs keyed by code.
     *
     * @since 1.0.0
     *
     * @return array<string, int>
     */
    protected function load_coupon_ids()
    {
        $ids = [];

        foreach (Coupon::query()->where_not_null('code')->get() as $coupon) {
            $ids[$coupon->code] = (int) $coupon->id;
        }

        return $ids;
    }

    /**
     * Load the seeded customers as the first shoppers, so they get an order history too.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function load_seeded_shoppers()
    {
        $shoppers = [];
        $regions = $this->get_regions();

        foreach (Customer::query()->get() as $index => $customer) {
            $shoppers[] = [
                'customer_id' => (int) $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address_line1' => (100 + $index) . ' Main Street',
                'region' => $regions[$index % count($regions)],
            ];
        }

        return $shoppers;
    }

    /**
     * Get the shipping regions with their tax and currency.
     *
     * US states are saved as state codes and Canadian provinces as names, as orders from older
     * checkouts can have both.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function get_regions()
    {
        return [
            ['country' => 'US', 'state' => 'CA', 'city' => 'Los Angeles', 'postal_code' => '90012', 'tax_name' => 'CA Sales Tax', 'tax_rate' => 7.25, 'shipping_taxable' => false, 'currency' => 'USD', 'weight' => 18],
            ['country' => 'US', 'state' => 'NY', 'city' => 'New York', 'postal_code' => '10001', 'tax_name' => 'NY Sales Tax', 'tax_rate' => 8.875, 'shipping_taxable' => true, 'currency' => 'USD', 'weight' => 15],
            ['country' => 'US', 'state' => 'TX', 'city' => 'Austin', 'postal_code' => '73301', 'tax_name' => 'TX Sales Tax', 'tax_rate' => 6.25, 'shipping_taxable' => true, 'currency' => 'USD', 'weight' => 12],
            ['country' => 'US', 'state' => 'FL', 'city' => 'Miami', 'postal_code' => '33101', 'tax_name' => 'FL Sales Tax', 'tax_rate' => 6.0, 'shipping_taxable' => false, 'currency' => 'USD', 'weight' => 9],
            ['country' => 'US', 'state' => 'WA', 'city' => 'Seattle', 'postal_code' => '98101', 'tax_name' => 'WA Sales Tax', 'tax_rate' => 6.5, 'shipping_taxable' => true, 'currency' => 'USD', 'weight' => 7],
            ['country' => 'CA', 'state' => 'Ontario', 'city' => 'Toronto', 'postal_code' => 'M5H 2N2', 'tax_name' => 'HST', 'tax_rate' => 13.0, 'shipping_taxable' => true, 'currency' => 'USD', 'weight' => 6],
            ['country' => 'GB', 'state' => null, 'city' => 'London', 'postal_code' => 'SW1A 1AA', 'tax_name' => 'VAT', 'tax_rate' => 20.0, 'shipping_taxable' => true, 'currency' => 'GBP', 'weight' => 10],
            ['country' => 'DE', 'state' => null, 'city' => 'Berlin', 'postal_code' => '10115', 'tax_name' => 'MwSt', 'tax_rate' => 19.0, 'shipping_taxable' => true, 'currency' => 'EUR', 'weight' => 9],
            ['country' => 'BD', 'state' => '771', 'city' => 'Dhaka', 'postal_code' => '1213', 'tax_name' => 'VAT', 'tax_rate' => 15.0, 'shipping_taxable' => false, 'currency' => 'USD', 'weight' => 6],
            ['country' => 'AU', 'state' => null, 'city' => 'Sydney', 'postal_code' => '2000', 'tax_name' => 'GST', 'tax_rate' => 10.0, 'shipping_taxable' => true, 'currency' => 'USD', 'weight' => 4],
        ];
    }

    /**
     * Get the shipping methods. The first three come from the seeded shipping settings; Express
     * Courier is a retired method that is only known from the order snapshots.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function get_shipping_methods()
    {
        return [
            ['id' => 'method-0001', 'name' => 'Standard Delivery', 'type' => 'flat_rate', 'base_amount' => 1400, 'is_taxable' => true, 'weight' => 55],
            ['id' => 'method-0002', 'name' => 'Local Pickup', 'type' => 'local_pickup', 'base_amount' => 900, 'is_taxable' => true, 'weight' => 12],
            ['id' => 'method-0003', 'name' => 'Rate by Weight', 'type' => 'weight', 'base_amount' => 500, 'is_taxable' => false, 'weight' => 20],
            ['id' => 'express-courier', 'name' => 'Express Courier', 'type' => 'flat_rate', 'base_amount' => 2500, 'is_taxable' => true, 'weight' => 13],
        ];
    }

    /**
     * Get the payment providers. PayPal and Cash on Delivery come from the plugin; the others are
     * only known from the order snapshots.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function get_payment_providers()
    {
        return [
            ['id' => 'paypal', 'name' => 'PayPal', 'weight' => 38],
            ['id' => 'stripe', 'name' => 'Stripe', 'weight' => 32],
            ['id' => 'cod', 'name' => 'Cash on Delivery', 'weight' => 18],
            ['id' => 'bank-transfer', 'name' => 'Bank Transfer', 'weight' => 8],
            ['id' => 'apple-pay', 'name' => 'Apple Pay', 'weight' => 4],
        ];
    }

    /**
     * Get the coupon codes from the seeded catalog with their discount rules.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function get_coupons()
    {
        $weights = ['WINTER20' => 22, 'WELCOME10' => 25, 'DENIM15' => 12, 'KICKS50' => 6, 'WARMSHIP' => 15, 'VIP25' => 5, 'KIDS10' => 9];
        $coupons = [];

        foreach (SeedCatalog::get_coupons() as $coupon) {
            if (empty($coupon['code'])) {
                continue;
            }

            $coupons[] = [
                'code' => $coupon['code'],
                'title' => $coupon['title'],
                'discount_type' => $coupon['discount_type'],
                'discount_target' => $coupon['discount_target'],
                'percentage' => (float) ($coupon['discount_amount_percentage'] ?? 0),
                'fixed' => $coupon['discount_value_type'] === 'fixed' ? (int) $coupon['base_discount_amount_fixed'] : null,
                'weight' => $weights[$coupon['code']] ?? 5,
            ];
        }

        return $coupons;
    }

    /**
     * Insert the collected rows, a chunk at a time, parents first, then empty the buffers.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function insert_rows()
    {
        $models = [
            'customers' => Customer::class,
            'orders' => OrderModel::class,
            'order_items' => OrderItem::class,
            'order_coupons' => OrderCoupon::class,
            'order_taxes' => OrderTax::class,
            'refunds' => Refund::class,
        ];

        foreach ($models as $key => $model) {
            foreach (array_chunk($this->rows[$key], static::INSERT_CHUNK) as $chunk) {
                $model::query()->insert($chunk);
            }

            $this->rows[$key] = [];
        }
    }

    /**
     * Pick one entry at random, in proportion to its weight.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $entries Entries with a weight key.
     *
     * @return array<string, mixed>
     */
    protected function pick_weighted(array $entries)
    {
        $roll = mt_rand(1, (int) array_sum(array_column($entries, 'weight')));

        foreach ($entries as $entry) {
            $roll -= $entry['weight'];

            if ($roll <= 0) {
                return $entry;
            }
        }

        return end($entries);
    }

    /**
     * Get a random number from 0 up to, but not including, 1.
     *
     * @since 1.0.0
     *
     * @return float
     */
    protected function chance()
    {
        return mt_rand() / (mt_getrandmax() + 1);
    }

    /**
     * Get a percentage of an amount, rounded to a whole minor unit.
     *
     * @since 1.0.0
     *
     * @param int   $amount  Amount in minor units.
     * @param float $percent Percentage.
     *
     * @return int
     */
    protected function percent_of(int $amount, float $percent)
    {
        return (int) round($amount * $percent / 100);
    }

    /**
     * Convert a base amount to the order currency.
     *
     * @since 1.0.0
     *
     * @param int                  $amount   Amount in base minor units.
     * @param array<string, mixed> $currency Order currency.
     *
     * @return int
     */
    protected function convert(int $amount, array $currency)
    {
        return (int) round($amount * $currency['rate']);
    }
}
