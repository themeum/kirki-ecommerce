<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

/**
 * Reads WooCommerce orders from the order tables (high-performance order storage).
 *
 * Table and column names follow the WooCommerce "High-Performance Order Storage: Database Schema" post.
 *
 * @since 1.0.0
 */
class HposOrderReader extends AbstractOrderReader
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function orders(int $cursor, int $limit)
    {
        $rows = $this->rows(
            DB::table('wc_orders')
                ->where('type', 'shop_order')
                ->where('status', 'like', 'wc-%')
                ->where('status', '!=', WooCommerceDatabase::DRAFT_ORDER_STATUS)
                ->where('id', '>', $cursor)
                ->order_by('id')
                ->limit($limit)
                ->select(['id', 'status', 'currency', 'tax_amount', 'total_amount', 'customer_id', 'date_created_gmt', 'date_updated_gmt', 'payment_method', 'payment_method_title', 'transaction_id', 'ip_address', 'user_agent', 'customer_note'])
                ->get()
        );

        if (empty($rows)) {
            return [];
        }

        $ids = array_column($rows, 'id');
        $addresses = $this->addresses($ids);
        $operational = $this->operational($ids);
        $refunds = $this->refunds($ids);
        $orders = [];

        foreach ($rows as $row) {
            $id = (int) $row['id'];
            $data = $operational[$id] ?? [];
            $shipping_tax = $this->amount($data['shipping_tax_amount'] ?? 0);

            $orders[] = [
                'id' => $id,
                'status' => $row['status'],
                'currency' => (string) $row['currency'],
                'date_created_gmt' => $this->date($row['date_created_gmt']),
                'date_modified_gmt' => $this->date($row['date_updated_gmt']),
                'date_paid_gmt' => $this->date($data['date_paid_gmt'] ?? null),
                'date_completed_gmt' => $this->date($data['date_completed_gmt'] ?? null),
                'customer_user_id' => (int) $row['customer_id'],
                'order_total' => $this->amount($row['total_amount']),
                'cart_tax' => $this->amount($row['tax_amount']),
                'shipping_total' => $this->amount($data['shipping_total_amount'] ?? 0),
                'shipping_tax' => $shipping_tax,
                'discount_total' => $this->amount($data['discount_total_amount'] ?? 0),
                'discount_tax' => $this->amount($data['discount_tax_amount'] ?? 0),
                'prices_include_tax' => !empty($data['prices_include_tax']),
                'payment_method' => (string) $row['payment_method'],
                'payment_method_title' => (string) $row['payment_method_title'],
                'transaction_id' => (string) $row['transaction_id'],
                'customer_note' => (string) $row['customer_note'],
                'ip_address' => (string) $row['ip_address'],
                'user_agent' => (string) $row['user_agent'],
                'billing' => $addresses[$id]['billing'] ?? $this->empty_address(),
                'shipping' => $addresses[$id]['shipping'] ?? $this->empty_address(),
                'refunds' => $refunds[$id] ?? [],
            ];
        }

        return $this->with_parts($orders);
    }

    /**
     * Read the addresses of orders, keyed by order id then purpose.
     *
     * @since 1.0.0
     *
     * @param int[] $ids The order ids.
     * @return array<int, array<string, array<string, string>>>
     */
    protected function addresses(array $ids)
    {
        $addresses = [];

        foreach ($this->rows(DB::table('wc_order_addresses')->where_in('order_id', $ids)->select(['order_id', 'address_type', 'first_name', 'last_name', 'company', 'address_1', 'address_2', 'city', 'state', 'postcode', 'country', 'email', 'phone'])->get()) as $row) {
            $address = [];

            foreach (array_keys($this->empty_address()) as $field) {
                $address[$field] = (string) ($row[$field] ?? '');
            }

            $addresses[(int) $row['order_id']][$row['address_type']] = $address;
        }

        return $addresses;
    }

    /**
     * Read the operational data of orders, keyed by order id.
     *
     * @since 1.0.0
     *
     * @param int[] $ids The order ids.
     * @return array<int, array<string, mixed>>
     */
    protected function operational(array $ids)
    {
        $data = [];

        foreach ($this->rows(DB::table('wc_order_operational_data')->where_in('order_id', $ids)->select(['order_id', 'prices_include_tax', 'date_paid_gmt', 'date_completed_gmt', 'shipping_tax_amount', 'shipping_total_amount', 'discount_tax_amount', 'discount_total_amount'])->get()) as $row) {
            $data[(int) $row['order_id']] = $row;
        }

        return $data;
    }

    /**
     * Read the refunds of orders, which are order rows of type shop_order_refund, keyed by order id.
     *
     * @since 1.0.0
     *
     * @param int[] $ids The order ids.
     * @return array<int, array<int, array<string, mixed>>>
     */
    protected function refunds(array $ids)
    {
        $rows = $this->rows(
            DB::table('wc_orders')
                ->where('type', 'shop_order_refund')
                ->where_in('parent_order_id', $ids)
                ->order_by('id')
                ->select(['id', 'parent_order_id as order_id', 'total_amount', 'date_created_gmt'])
                ->get()
        );

        if (empty($rows)) {
            return [];
        }

        $meta = [];

        foreach ($this->rows(DB::table('wc_orders_meta')->where_in('order_id', array_column($rows, 'id'))->where_in('meta_key', ['_refund_amount', '_refund_reason'])->select(['order_id', 'meta_key', 'meta_value'])->get()) as $row) {
            $meta[(int) $row['order_id']][$row['meta_key']] = $row['meta_value'];
        }

        $refunds = [];

        foreach ($rows as $row) {
            $refunds[(int) $row['order_id']][] = [
                'id' => (int) $row['id'],
                'amount' => $this->amount($meta[(int) $row['id']]['_refund_amount'] ?? abs((float) $row['total_amount'])),
                'reason' => (string) ($meta[(int) $row['id']]['_refund_reason'] ?? ''),
                'date_gmt' => $this->date($row['date_created_gmt']),
            ];
        }

        return $refunds;
    }

    /**
     * Get an address with every field empty.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function empty_address()
    {
        return array_fill_keys(['first_name', 'last_name', 'company', 'address_1', 'address_2', 'city', 'state', 'postcode', 'country', 'email', 'phone'], '');
    }
}
