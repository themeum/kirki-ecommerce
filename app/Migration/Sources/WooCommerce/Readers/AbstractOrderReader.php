<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Supports\Facades\DB;

/**
 * Reads the parts of an order that WooCommerce stores the same way in both layouts: items, notes and SKUs.
 *
 * @since 1.0.0
 */
abstract class AbstractOrderReader implements OrderReader
{
    /** The order item meta keys that are read. */
    public const ITEM_META_KEYS = [
        '_product_id', '_variation_id', '_qty', '_line_subtotal', '_line_subtotal_tax', '_line_total', '_line_tax',
        'method_id', 'instance_id', 'cost', 'total_tax',
        'rate_id', 'label', 'rate_percent', 'tax_amount', 'shipping_tax_amount',
        'discount_amount', 'discount_amount_tax', '_fee_amount',
    ];

    /**
     * Turn a query result into a list of plain arrays.
     *
     * @since 1.0.0
     *
     * @param iterable $result The query result.
     * @return array<int, array<string, mixed>>
     */
    protected function rows($result)
    {
        $rows = [];

        foreach ($result as $row) {
            $rows[] = (array) $row;
        }

        return $rows;
    }

    /**
     * Add items, notes and the SKU of each product line to orders.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $orders The orders with an id.
     * @return array<int, array<string, mixed>>
     */
    protected function with_parts(array $orders)
    {
        if (empty($orders)) {
            return $orders;
        }

        $ids = array_column($orders, 'id');
        $items = $this->items($ids);
        $notes = $this->notes($ids);
        $skus = $this->skus($items);

        foreach ($orders as $index => $order) {
            $order_items = $items[$order['id']] ?? [];

            foreach ($order_items as $item_index => $item) {
                $source_id = (int) ($item['meta']['_variation_id'] ?? 0) ?: (int) ($item['meta']['_product_id'] ?? 0);
                $order_items[$item_index]['sku'] = $skus[$source_id] ?? null;
            }

            $orders[$index]['items'] = $order_items;
            $orders[$index]['notes'] = $notes[$order['id']] ?? [];
        }

        return $orders;
    }

    /**
     * Read the order items with their meta, keyed by order id.
     *
     * @since 1.0.0
     *
     * @param int[] $order_ids The order ids.
     * @return array<int, array<int, array<string, mixed>>>
     */
    protected function items(array $order_ids)
    {
        if (!$this->has_table('woocommerce_order_items')) {
            return [];
        }

        $rows = $this->rows(
            DB::table('woocommerce_order_items')
                ->where_in('order_id', $order_ids)
                ->order_by('order_item_id')
                ->select(['order_item_id as id', 'order_id', 'order_item_name as name', 'order_item_type as type'])
                ->get()
        );

        if (empty($rows)) {
            return [];
        }

        $meta = [];

        foreach ($this->rows(DB::table('woocommerce_order_itemmeta')->where_in('order_item_id', array_column($rows, 'id'))->where_in('meta_key', static::ITEM_META_KEYS)->select(['order_item_id', 'meta_key', 'meta_value'])->get()) as $row) {
            $meta[(int) $row['order_item_id']][$row['meta_key']] = $row['meta_value'];
        }

        $items = [];

        foreach ($rows as $row) {
            $items[(int) $row['order_id']][] = ['id' => (int) $row['id'], 'name' => $row['name'], 'type' => $row['type'], 'meta' => $meta[(int) $row['id']] ?? []];
        }

        return $items;
    }

    /**
     * Read the order notes, keyed by order id.
     *
     * @since 1.0.0
     *
     * @param int[] $order_ids The order ids.
     * @return array<int, array<int, array<string, mixed>>>
     */
    protected function notes(array $order_ids)
    {
        $rows = $this->rows(
            DB::table('comments')
                ->where_in('comment_post_ID', $order_ids)
                ->where('comment_type', 'order_note')
                ->order_by('comment_ID')
                ->select(['comment_ID as id', 'comment_post_ID as order_id', 'comment_content as content', 'comment_date_gmt as date_gmt', 'comment_author as author'])
                ->get()
        );

        if (empty($rows)) {
            return [];
        }

        $customer_notes = [];

        foreach ($this->rows(DB::table('commentmeta')->where_in('comment_id', array_column($rows, 'id'))->where('meta_key', 'is_customer_note')->select(['comment_id', 'meta_value'])->get()) as $row) {
            $customer_notes[(int) $row['comment_id']] = (bool) $row['meta_value'];
        }

        $notes = [];

        foreach ($rows as $row) {
            $row['is_customer_note'] = $customer_notes[(int) $row['id']] ?? false;
            $notes[(int) $row['order_id']][] = $row;
        }

        return $notes;
    }

    /**
     * Read the SKU of the products and variations that order lines point to.
     *
     * @since 1.0.0
     *
     * @param array<int, array<int, array<string, mixed>>> $items Order items keyed by order id.
     * @return array<int, string>
     */
    protected function skus(array $items)
    {
        $ids = [];

        foreach ($items as $order_items) {
            foreach ($order_items as $item) {
                $source_id = (int) ($item['meta']['_variation_id'] ?? 0) ?: (int) ($item['meta']['_product_id'] ?? 0);

                if ($source_id > 0) {
                    $ids[] = $source_id;
                }
            }
        }

        if (empty($ids)) {
            return [];
        }

        $skus = [];

        foreach ($this->rows(DB::table('postmeta')->where_in('post_id', array_unique($ids))->where('meta_key', '_sku')->select(['post_id', 'meta_value'])->get()) as $row) {
            if ($row['meta_value'] !== '') {
                $skus[(int) $row['post_id']] = $row['meta_value'];
            }
        }

        return $skus;
    }

    /**
     * Check whether a table exists. The name has no prefix.
     *
     * @since 1.0.0
     *
     * @param string $table The table name.
     * @return bool
     */
    protected function has_table(string $table)
    {
        return (bool) \Kirki\Ecommerce\Framework\Supports\Facades\Schema::has_table($table);
    }

    /**
     * Turn a GMT date into a date, or null for an empty one.
     *
     * @since 1.0.0
     *
     * @param mixed $date The date.
     * @return string|null
     */
    protected function date($date)
    {
        return $date && strpos((string) $date, '0000-00-00') !== 0 ? (string) $date : null;
    }

    /**
     * Turn an amount into a plain decimal string without trailing zeros, so both layouts give the same text.
     *
     * @since 1.0.0
     *
     * @param mixed $amount The amount.
     * @return string
     */
    protected function amount($amount)
    {
        $text = rtrim(rtrim(number_format((float) $amount, 8, '.', ''), '0'), '.');

        return $text === '' || $text === '-0' ? '0' : $text;
    }

    /**
     * Turn a Unix timestamp into a GMT date, or null for an empty one.
     *
     * @since 1.0.0
     *
     * @param mixed $timestamp The timestamp.
     * @return string|null
     */
    protected function timestamp_date($timestamp)
    {
        return (int) $timestamp > 0 ? gmdate('Y-m-d H:i:s', (int) $timestamp) : null;
    }
}
