<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers;

defined('ABSPATH') || exit;

/**
 * Reads WooCommerce orders from one storage layout in one normalized shape.
 *
 * @since 1.0.0
 */
interface OrderReader
{
    /**
     * Read the next orders after an order id, each with its items, notes and refunds.
     *
     * Each order has: id, status, currency, date_created_gmt, date_modified_gmt, date_paid_gmt,
     * date_completed_gmt, customer_user_id, order_total, cart_tax, shipping_total, shipping_tax,
     * discount_total, discount_tax, prices_include_tax, payment_method, payment_method_title,
     * transaction_id, customer_note, ip_address, user_agent, billing, shipping, items, notes, refunds.
     *
     * @since 1.0.0
     *
     * @param int $cursor The id of the last order already processed.
     * @param int $limit  The most orders to return.
     * @return array<int, array<string, mixed>>
     */
    public function orders(int $cursor, int $limit);
}
