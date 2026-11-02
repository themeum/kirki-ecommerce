<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Read-only access to the WooCommerce tables and the counts shown in the scan.
 *
 * @since 1.0.0
 */
class WooCommerceDatabase
{
    /** Post statuses that count as live records; trashed and draft-shell rows are left out. */
    public const POST_STATUSES = ['publish', 'draft', 'private', 'pending', 'future'];

    /** The status of a cart that has not become an order yet. Any other "wc-" status is an order, also a custom one. */
    public const DRAFT_ORDER_STATUS = 'wc-checkout-draft';

    /**
     * Check whether a table exists. The name has no prefix.
     *
     * @since 1.0.0
     *
     * @param string $table The table name without prefix.
     * @return bool
     */
    public function has_table(string $table)
    {
        return (bool) Schema::has_table($table);
    }

    /**
     * Count products, not including variations.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function count_products()
    {
        return (int) DB::table('posts')->where('post_type', 'product')->where_in('post_status', static::POST_STATUSES)->count();
    }

    /**
     * Count orders in the storage WooCommerce uses.
     *
     * Orders have a stored status that starts with "wc-". Draft carts, draft shells and trashed orders are not counted.
     *
     * @since 1.0.0
     *
     * @param bool $uses_order_tables True when orders are in the order tables, false when in posts.
     * @return int
     */
    public function count_orders(bool $uses_order_tables)
    {
        if ($uses_order_tables) {
            return (int) DB::table('wc_orders')->where('type', 'shop_order')->where('status', 'like', 'wc-%')->where('status', '!=', static::DRAFT_ORDER_STATUS)->count();
        }

        return (int) DB::table('posts')->where('post_type', 'shop_order')->where('post_status', 'like', 'wc-%')->where('post_status', '!=', static::DRAFT_ORDER_STATUS)->count();
    }

    /**
     * Count coupons.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function count_coupons()
    {
        return (int) DB::table('posts')->where('post_type', 'shop_coupon')->where_in('post_status', static::POST_STATUSES)->count();
    }

    /**
     * Count the terms of a taxonomy.
     *
     * @since 1.0.0
     *
     * @param string $taxonomy The taxonomy name, for example "product_cat".
     * @return int
     */
    public function count_terms(string $taxonomy)
    {
        return (int) DB::table('term_taxonomy')->where('taxonomy', $taxonomy)->count();
    }

    /**
     * Count global product attributes.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function count_attributes()
    {
        if (!$this->has_table('woocommerce_attribute_taxonomies')) {
            return 0;
        }

        return (int) DB::table('woocommerce_attribute_taxonomies')->count();
    }

    /**
     * Count registered customers, which are WordPress users with the customer role.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function count_customers()
    {
        return (int) DB::table('usermeta')
            ->where('meta_key', DB::get_table_prefix() . 'capabilities')
            ->where('meta_value', 'like', '%"customer"%')
            ->count();
    }

    /**
     * Count tax rates.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function count_tax_rates()
    {
        return $this->has_table('woocommerce_tax_rates') ? (int) DB::table('woocommerce_tax_rates')->count() : 0;
    }

    /**
     * Count shipping zones.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function count_shipping_zones()
    {
        return $this->has_table('woocommerce_shipping_zones') ? (int) DB::table('woocommerce_shipping_zones')->count() : 0;
    }

    /**
     * Read the next terms of a taxonomy after a term id, with their image id.
     *
     * @since 1.0.0
     *
     * @param string $taxonomy The taxonomy name, for example "product_cat".
     * @param int    $cursor   The term id of the last term already processed.
     * @param int    $limit    The most terms to return.
     * @return array<int, array<string, mixed>> Rows with id, name, slug, description, parent and image_id.
     */
    public function terms(string $taxonomy, int $cursor, int $limit)
    {
        $rows = $this->rows(
            DB::table('term_taxonomy as tt')
                ->join('terms as t', 't.term_id', '=', 'tt.term_id')
                ->where('tt.taxonomy', $taxonomy)
                ->where('t.term_id', '>', $cursor)
                ->order_by('t.term_id')
                ->limit($limit)
                ->select(['t.term_id as id', 't.name', 't.slug', 'tt.description', 'tt.parent'])
                ->get()
        );

        return $this->with_term_images($rows);
    }

    /**
     * Read one term of a taxonomy, with its image id.
     *
     * @since 1.0.0
     *
     * @param string $taxonomy The taxonomy name.
     * @param int    $term_id  The term id.
     * @return array<string, mixed>|null Null when the term does not exist.
     */
    public function term(string $taxonomy, int $term_id)
    {
        $rows = $this->rows(
            DB::table('term_taxonomy as tt')
                ->join('terms as t', 't.term_id', '=', 'tt.term_id')
                ->where('tt.taxonomy', $taxonomy)
                ->where('t.term_id', $term_id)
                ->select(['t.term_id as id', 't.name', 't.slug', 'tt.description', 'tt.parent'])
                ->get()
        );

        $rows = $this->with_term_images($rows);

        return $rows[0] ?? null;
    }

    /**
     * Read the next global attributes after an attribute id.
     *
     * @since 1.0.0
     *
     * @param int $cursor The id of the last attribute already processed.
     * @param int $limit  The most attributes to return.
     * @return array<int, array<string, mixed>> Rows with id, name (slug), label and type.
     */
    public function attributes(int $cursor, int $limit)
    {
        if (!$this->has_table('woocommerce_attribute_taxonomies')) {
            return [];
        }

        return $this->rows(
            DB::table('woocommerce_attribute_taxonomies')
                ->where('attribute_id', '>', $cursor)
                ->order_by('attribute_id')
                ->limit($limit)
                ->select(['attribute_id as id', 'attribute_name as name', 'attribute_label as label', 'attribute_type as type'])
                ->get()
        );
    }

    /**
     * Read the value terms of a global attribute, which are terms of the "pa_<name>" taxonomy.
     *
     * @since 1.0.0
     *
     * @param string $attribute_name The attribute name without the "pa_" prefix.
     * @return array<int, array<string, mixed>> Rows with id and name.
     */
    public function attribute_values(string $attribute_name)
    {
        return $this->rows(
            DB::table('term_taxonomy as tt')
                ->join('terms as t', 't.term_id', '=', 'tt.term_id')
                ->where('tt.taxonomy', 'pa_' . $attribute_name)
                ->order_by('t.term_id')
                ->select(['t.term_id as id', 't.name'])
                ->get()
        );
    }

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
     * Add the image id of each term, which WooCommerce keeps in the "thumbnail_id" term meta.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $rows Term rows with an id.
     * @return array<int, array<string, mixed>>
     */
    protected function with_term_images(array $rows)
    {
        if (empty($rows)) {
            return $rows;
        }

        $images = $this->rows(
            DB::table('termmeta')
                ->where('meta_key', 'thumbnail_id')
                ->where_in('term_id', array_column($rows, 'id'))
                ->select(['term_id', 'meta_value'])
                ->get()
        );
        $images = array_column($images, 'meta_value', 'term_id');

        foreach ($rows as $index => $row) {
            $image_id = (int) ($images[$row['id']] ?? 0);
            $rows[$index]['image_id'] = $image_id > 0 ? $image_id : null;
        }

        return $rows;
    }

    /**
     * Read the next posts of a type after a post id.
     *
     * @since 1.0.0
     *
     * @param string   $post_type The post type, for example "shop_coupon".
     * @param string[] $statuses  The post statuses to include.
     * @param int      $cursor    The post id of the last post already processed.
     * @param int      $limit     The most posts to return.
     * @return array<int, array<string, mixed>> Rows with id, title, excerpt, status, date_gmt and parent.
     */
    public function posts_of_type(string $post_type, array $statuses, int $cursor, int $limit)
    {
        return $this->rows(
            DB::table('posts')
                ->where('post_type', $post_type)
                ->where_in('post_status', $statuses)
                ->where('ID', '>', $cursor)
                ->order_by('ID')
                ->limit($limit)
                ->select(['ID as id', 'post_parent as parent', 'post_title as title', 'post_excerpt as excerpt', 'post_status as status', 'post_date_gmt as date_gmt'])
                ->get()
        );
    }

    /**
     * Read chosen meta keys of posts, keyed by post id then meta key. Serialized values are unserialized.
     *
     * @since 1.0.0
     *
     * @param int[]    $post_ids The post ids.
     * @param string[] $keys     The meta keys to read.
     * @return array<int, array<string, mixed>>
     */
    public function post_meta(array $post_ids, array $keys)
    {
        if (empty($post_ids)) {
            return [];
        }

        $meta = [];

        foreach ($this->rows(DB::table('postmeta')->where_in('post_id', $post_ids)->where_in('meta_key', $keys)->select(['post_id', 'meta_key', 'meta_value'])->get()) as $row) {
            $meta[(int) $row['post_id']][$row['meta_key']] = maybe_unserialize($row['meta_value']);
        }

        return $meta;
    }

    /**
     * Read the next registered customers after a user id, with their user meta.
     *
     * @since 1.0.0
     *
     * @param int      $cursor The user id of the last customer already processed.
     * @param int      $limit  The most customers to return.
     * @param string[] $keys   The user meta keys to read.
     * @return array<int, array<string, mixed>> Rows with id, email, registered_at and meta.
     */
    public function customers(int $cursor, int $limit, array $keys)
    {
        $rows = $this->rows(
            DB::table('users as u')
                ->join('usermeta as um', 'um.user_id', '=', 'u.ID')
                ->where('um.meta_key', DB::get_table_prefix() . 'capabilities')
                ->where('um.meta_value', 'like', '%"customer"%')
                ->where('u.ID', '>', $cursor)
                ->order_by('u.ID')
                ->limit($limit)
                ->select(['u.ID as id', 'u.user_email as email', 'u.user_registered as registered_at', 'u.display_name as display_name'])
                ->get()
        );

        if (empty($rows)) {
            return [];
        }

        $meta = [];

        foreach ($this->rows(DB::table('usermeta')->where_in('user_id', array_column($rows, 'id'))->where_in('meta_key', $keys)->select(['user_id', 'meta_key', 'meta_value'])->get()) as $row) {
            $meta[(int) $row['user_id']][$row['meta_key']] = $row['meta_value'];
        }

        foreach ($rows as $index => $row) {
            $rows[$index]['meta'] = $meta[(int) $row['id']] ?? [];
        }

        return $rows;
    }
}
