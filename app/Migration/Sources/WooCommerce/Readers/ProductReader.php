<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

/**
 * Reads WooCommerce products with their meta, terms and variations.
 *
 * Post and meta keys follow the WooCommerce product data stores.
 *
 * @since 1.0.0
 */
class ProductReader
{
    /** Product and variation meta keys that are read. */
    public const META_KEYS = [
        '_sku', '_global_unique_id', '_regular_price', '_sale_price', '_price',
        '_sale_price_dates_from', '_sale_price_dates_to',
        '_manage_stock', '_stock', '_stock_status', '_backorders', '_low_stock_amount', '_sold_individually',
        '_weight', '_tax_status', '_virtual', '_thumbnail_id', '_product_image_gallery', '_product_attributes',
        '_yoast_wpseo_title', '_yoast_wpseo_metadesc', 'rank_math_title', 'rank_math_description',
    ];

    /** Taxonomies whose terms are read for each product. */
    public const TAXONOMIES = ['product_cat', 'product_tag', 'product_brand', 'product_type'];

    /** @var WooCommerceDatabase */
    protected $database;

    /**
     * Create the reader.
     *
     * @since 1.0.0
     *
     * @param WooCommerceDatabase $database Read access to the WooCommerce tables.
     */
    public function __construct(WooCommerceDatabase $database)
    {
        $this->database = $database;
    }

    /**
     * Read the next products after a post id, each with meta, terms and variations.
     *
     * @since 1.0.0
     *
     * @param int $cursor The post id of the last product already processed.
     * @param int $limit  The most products to return.
     * @return array<int, array<string, mixed>>
     */
    public function products(int $cursor, int $limit)
    {
        $rows = $this->posts(
            DB::table('posts')
                ->where('post_type', 'product')
                ->where_in('post_status', WooCommerceDatabase::POST_STATUSES)
                ->where('ID', '>', $cursor)
                ->order_by('ID')
                ->limit($limit)
        );

        if (empty($rows)) {
            return [];
        }

        $ids = array_column($rows, 'id');
        $meta = $this->meta($ids);
        $terms = $this->terms($ids);
        $variations = $this->variations($ids);
        $images = $this->existing_attachments($this->image_ids($rows, $meta, $variations));

        foreach ($rows as $index => $row) {
            $id = $row['id'];
            $rows[$index]['meta'] = $meta[$id] ?? [];
            $rows[$index]['terms'] = $terms[$id] ?? [];
            $rows[$index]['variations'] = $variations[$id] ?? [];
            $rows[$index]['attachments'] = $images;
        }

        return $rows;
    }

    /**
     * Find the term id of a term by its slug, used to turn a variation's attribute choice into a term.
     *
     * @since 1.0.0
     *
     * @param string $taxonomy The taxonomy, for example "pa_size".
     * @param string $slug     The term slug.
     * @return int|null
     */
    public function term_id_by_slug(string $taxonomy, string $slug)
    {
        $row = DB::table('term_taxonomy as tt')
            ->join('terms as t', 't.term_id', '=', 'tt.term_id')
            ->where('tt.taxonomy', $taxonomy)
            ->where('t.slug', $slug)
            ->select(['t.term_id as id'])
            ->first();

        return $row ? (int) ((array) $row)['id'] : null;
    }

    /**
     * Read the product ids and posts of a query as plain rows.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\Framework\Database\Query\QueryBuilder $query The posts query.
     * @return array<int, array<string, mixed>>
     */
    protected function posts($query)
    {
        $rows = [];

        foreach ($query->select(['ID as id', 'post_parent as parent', 'post_title as title', 'post_name as slug', 'post_content as content', 'post_excerpt as excerpt', 'post_status as status', 'post_date_gmt as date_gmt'])->get() as $row) {
            $rows[] = (array) $row;
        }

        return $rows;
    }

    /**
     * Read the needed meta of posts, keyed by post id then meta key. Variation attribute choices are included.
     *
     * @since 1.0.0
     *
     * @param int[] $ids The post ids.
     * @return array<int, array<string, mixed>>
     */
    protected function meta(array $ids)
    {
        $found = DB::table('postmeta')
            ->where_in('post_id', $ids)
            ->where_raw('(meta_key IN (' . implode(',', array_fill(0, count(static::META_KEYS), '%s')) . ') OR meta_key LIKE %s)', array_merge(static::META_KEYS, ['attribute\\_%']))
            ->select(['post_id', 'meta_key', 'meta_value'])
            ->get();

        $meta = [];

        foreach ($found as $row) {
            $row = (array) $row;
            $meta[(int) $row['post_id']][$row['meta_key']] = $row['meta_key'] === '_product_attributes' ? maybe_unserialize($row['meta_value']) : $row['meta_value'];
        }

        return $meta;
    }

    /**
     * Read the terms of products in the product taxonomies, keyed by product id then taxonomy.
     *
     * @since 1.0.0
     *
     * @param int[] $ids The product ids.
     * @return array<int, array<string, array<int, array<string, mixed>>>>
     */
    protected function terms(array $ids)
    {
        $base = function () use ($ids) {
            return DB::table('term_relationships as tr')
                ->join('term_taxonomy as tt', 'tt.term_taxonomy_id', '=', 'tr.term_taxonomy_id')
                ->join('terms as t', 't.term_id', '=', 'tt.term_id')
                ->where_in('tr.object_id', $ids)
                ->select(['tr.object_id as object_id', 'tt.taxonomy as taxonomy', 't.term_id as id', 't.name as name', 't.slug as slug']);
        };

        $found = array_merge(
            $base()->where_in('tt.taxonomy', static::TAXONOMIES)->get()->all(),
            $base()->where('tt.taxonomy', 'like', 'pa\\_%')->get()->all()
        );

        $terms = [];

        foreach ($found as $row) {
            $row = (array) $row;
            $terms[(int) $row['object_id']][$row['taxonomy']][] = ['id' => (int) $row['id'], 'name' => $row['name'], 'slug' => $row['slug']];
        }

        return $terms;
    }

    /**
     * Read the variations of products, keyed by parent product id.
     *
     * @since 1.0.0
     *
     * @param int[] $parent_ids The product ids.
     * @return array<int, array<int, array<string, mixed>>>
     */
    protected function variations(array $parent_ids)
    {
        $rows = $this->posts(
            DB::table('posts')
                ->where('post_type', 'product_variation')
                ->where_in('post_status', ['publish', 'private'])
                ->where_in('post_parent', $parent_ids)
                ->order_by('menu_order')
                ->order_by('ID')
        );

        if (empty($rows)) {
            return [];
        }

        $meta = $this->meta(array_column($rows, 'id'));
        $variations = [];

        foreach ($rows as $row) {
            $row['meta'] = $meta[$row['id']] ?? [];
            $variations[(int) $row['parent']][] = $row;
        }

        return $variations;
    }

    /**
     * Collect the image ids that products and variations point to.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>>      $rows       The product rows.
     * @param array<int, array<string, mixed>>      $meta       Product meta keyed by id.
     * @param array<int, array<int, array<string, mixed>>> $variations Variations keyed by parent id.
     * @return int[]
     */
    protected function image_ids(array $rows, array $meta, array $variations)
    {
        $ids = [];
        $sets = [];

        foreach ($rows as $row) {
            $sets[] = $meta[$row['id']] ?? [];
        }

        foreach ($variations as $list) {
            foreach ($list as $variation) {
                $sets[] = $variation['meta'];
            }
        }

        foreach ($sets as $set) {
            $ids[] = (int) ($set['_thumbnail_id'] ?? 0);

            foreach (explode(',', (string) ($set['_product_image_gallery'] ?? '')) as $gallery_id) {
                $ids[] = (int) $gallery_id;
            }
        }

        return array_values(array_unique(array_filter($ids)));
    }

    /**
     * Keep only the ids of attachments that exist, so no product points to a missing file.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Attachment ids.
     * @return int[]
     */
    protected function existing_attachments(array $ids)
    {
        if (empty($ids)) {
            return [];
        }

        $found = [];

        foreach (DB::table('posts')->where('post_type', 'attachment')->where_in('ID', $ids)->select(['ID as id'])->get() as $row) {
            $found[] = (int) ((array) $row)['id'];
        }

        return $found;
    }
}
