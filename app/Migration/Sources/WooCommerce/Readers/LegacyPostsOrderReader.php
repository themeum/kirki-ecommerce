<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

/**
 * Reads WooCommerce orders from the posts and post meta tables.
 *
 * Post and meta keys follow the WooCommerce order data store.
 *
 * @since 1.0.0
 */
class LegacyPostsOrderReader extends AbstractOrderReader
{
    /** The order meta keys that are read. */
    public const META_KEYS = [
        '_order_total', '_order_tax', '_order_shipping', '_order_shipping_tax', '_cart_discount', '_cart_discount_tax',
        '_order_currency', '_prices_include_tax', '_customer_user', '_payment_method', '_payment_method_title',
        '_transaction_id', '_date_paid', '_date_completed', '_customer_ip_address', '_customer_user_agent',
        '_billing_first_name', '_billing_last_name', '_billing_company', '_billing_address_1', '_billing_address_2',
        '_billing_city', '_billing_state', '_billing_postcode', '_billing_country', '_billing_email', '_billing_phone',
        '_shipping_first_name', '_shipping_last_name', '_shipping_company', '_shipping_address_1', '_shipping_address_2',
        '_shipping_city', '_shipping_state', '_shipping_postcode', '_shipping_country', '_shipping_phone',
    ];

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function orders(int $cursor, int $limit)
    {
        $posts = $this->rows(
            DB::table('posts')
                ->where('post_type', 'shop_order')
                ->where('post_status', 'like', 'wc-%')
                ->where('post_status', '!=', WooCommerceDatabase::DRAFT_ORDER_STATUS)
                ->where('ID', '>', $cursor)
                ->order_by('ID')
                ->limit($limit)
                ->select(['ID as id', 'post_status as status', 'post_excerpt as customer_note', 'post_date_gmt as date_created_gmt', 'post_modified_gmt as date_modified_gmt'])
                ->get()
        );

        if (empty($posts)) {
            return [];
        }

        $ids = array_column($posts, 'id');
        $meta = $this->meta($ids);
        $refunds = $this->refunds($ids);
        $orders = [];

        foreach ($posts as $post) {
            $orders[] = $this->normalize($post, $meta[$post['id']] ?? [], $refunds[$post['id']] ?? []);
        }

        return $this->with_parts($orders);
    }

    /**
     * Build one normalized order.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $post    The order post.
     * @param array<string, mixed> $meta    The order meta.
     * @param array<int, array<string, mixed>> $refunds The refunds of the order.
     * @return array<string, mixed>
     */
    protected function normalize(array $post, array $meta, array $refunds)
    {
        return [
            'id' => (int) $post['id'],
            'status' => $post['status'],
            'currency' => (string) ($meta['_order_currency'] ?? ''),
            'date_created_gmt' => $this->date($post['date_created_gmt']),
            'date_modified_gmt' => $this->date($post['date_modified_gmt']),
            'date_paid_gmt' => $this->timestamp_date($meta['_date_paid'] ?? 0),
            'date_completed_gmt' => $this->timestamp_date($meta['_date_completed'] ?? 0),
            'customer_user_id' => (int) ($meta['_customer_user'] ?? 0),
            'order_total' => $this->amount($meta['_order_total'] ?? 0),
            'cart_tax' => $this->amount($meta['_order_tax'] ?? 0),
            'shipping_total' => $this->amount($meta['_order_shipping'] ?? 0),
            'shipping_tax' => $this->amount($meta['_order_shipping_tax'] ?? 0),
            'discount_total' => $this->amount($meta['_cart_discount'] ?? 0),
            'discount_tax' => $this->amount($meta['_cart_discount_tax'] ?? 0),
            'prices_include_tax' => ($meta['_prices_include_tax'] ?? 'no') === 'yes',
            'payment_method' => (string) ($meta['_payment_method'] ?? ''),
            'payment_method_title' => (string) ($meta['_payment_method_title'] ?? ''),
            'transaction_id' => (string) ($meta['_transaction_id'] ?? ''),
            'customer_note' => (string) $post['customer_note'],
            'ip_address' => (string) ($meta['_customer_ip_address'] ?? ''),
            'user_agent' => (string) ($meta['_customer_user_agent'] ?? ''),
            'billing' => $this->address($meta, 'billing'),
            'shipping' => $this->address($meta, 'shipping'),
            'refunds' => $refunds,
        ];
    }

    /**
     * Collect an address from the order meta.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta    The order meta.
     * @param string               $purpose "billing" or "shipping".
     * @return array<string, string>
     */
    protected function address(array $meta, string $purpose)
    {
        $address = [];

        foreach (['first_name', 'last_name', 'company', 'address_1', 'address_2', 'city', 'state', 'postcode', 'country', 'email', 'phone'] as $field) {
            $address[$field] = (string) ($meta['_' . $purpose . '_' . $field] ?? '');
        }

        return $address;
    }

    /**
     * Read the needed meta of orders, keyed by order id then meta key.
     *
     * @since 1.0.0
     *
     * @param int[] $ids The order ids.
     * @return array<int, array<string, mixed>>
     */
    protected function meta(array $ids)
    {
        $meta = [];

        foreach ($this->rows(DB::table('postmeta')->where_in('post_id', $ids)->where_in('meta_key', static::META_KEYS)->select(['post_id', 'meta_key', 'meta_value'])->get()) as $row) {
            $meta[(int) $row['post_id']][$row['meta_key']] = $row['meta_value'];
        }

        return $meta;
    }

    /**
     * Read the refunds of orders, which are child posts, keyed by order id.
     *
     * @since 1.0.0
     *
     * @param int[] $ids The order ids.
     * @return array<int, array<int, array<string, mixed>>>
     */
    protected function refunds(array $ids)
    {
        $posts = $this->rows(
            DB::table('posts')
                ->where('post_type', 'shop_order_refund')
                ->where_in('post_parent', $ids)
                ->order_by('ID')
                ->select(['ID as id', 'post_parent as order_id', 'post_excerpt as excerpt', 'post_date_gmt as date_gmt'])
                ->get()
        );

        if (empty($posts)) {
            return [];
        }

        $meta = [];

        foreach ($this->rows(DB::table('postmeta')->where_in('post_id', array_column($posts, 'id'))->where_in('meta_key', ['_refund_amount', '_refund_reason'])->select(['post_id', 'meta_key', 'meta_value'])->get()) as $row) {
            $meta[(int) $row['post_id']][$row['meta_key']] = $row['meta_value'];
        }

        $refunds = [];

        foreach ($posts as $post) {
            $refunds[(int) $post['order_id']][] = [
                'id' => (int) $post['id'],
                'amount' => $this->amount($meta[(int) $post['id']]['_refund_amount'] ?? 0),
                'reason' => (string) ($meta[(int) $post['id']]['_refund_reason'] ?? $post['excerpt']),
                'date_gmt' => $this->date($post['date_gmt']),
            ];
        }

        return $refunds;
    }
}
