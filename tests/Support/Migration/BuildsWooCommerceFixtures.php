<?php

namespace Kirki\Ecommerce\Tests\Support\Migration;

/**
 * Builds WooCommerce-shaped tables and rows from the published WooCommerce schema, so no WooCommerce install is needed.
 *
 * Table definitions follow the "High-Performance Order Storage: Database Schema" post and the
 * WooCommerce "Database Description" wiki. Post and meta keys follow the WooCommerce data stores.
 */
trait BuildsWooCommerceFixtures
{
    /** @var string[] Tables created by the test, dropped again afterwards. */
    protected $woo_tables = [];

    /** @var int[] Users created by the test, deleted again afterwards. */
    protected $woo_user_ids = [];

    /**
     * Register the taxonomies WooCommerce adds, so terms can be inserted.
     *
     * @return void
     */
    protected function register_woo_taxonomies(): void
    {
        foreach (['product_cat', 'product_tag', 'product_brand'] as $taxonomy) {
            register_taxonomy($taxonomy, 'product', ['hierarchical' => $taxonomy !== 'product_tag']);
        }
    }

    /**
     * Create the order storage and shared WooCommerce tables.
     *
     * @param bool $order_tables Also create the order tables (HPOS).
     * @return void
     */
    protected function create_woo_tables(bool $order_tables = true): void
    {
        global $wpdb;

        $p = $wpdb->prefix;
        $statements = [
            'woocommerce_order_items' => "CREATE TABLE IF NOT EXISTS {$p}woocommerce_order_items (order_item_id bigint unsigned NOT NULL AUTO_INCREMENT, order_item_name text NOT NULL, order_item_type varchar(200) NOT NULL DEFAULT '', order_id bigint unsigned NOT NULL, PRIMARY KEY (order_item_id))",
            'woocommerce_order_itemmeta' => "CREATE TABLE IF NOT EXISTS {$p}woocommerce_order_itemmeta (meta_id bigint unsigned NOT NULL AUTO_INCREMENT, order_item_id bigint unsigned NOT NULL, meta_key varchar(255) DEFAULT NULL, meta_value longtext, PRIMARY KEY (meta_id))",
            'woocommerce_attribute_taxonomies' => "CREATE TABLE IF NOT EXISTS {$p}woocommerce_attribute_taxonomies (attribute_id bigint unsigned NOT NULL AUTO_INCREMENT, attribute_name varchar(200) NOT NULL, attribute_label varchar(200) DEFAULT NULL, attribute_type varchar(20) NOT NULL DEFAULT 'select', attribute_orderby varchar(20) NOT NULL DEFAULT 'menu_order', attribute_public int NOT NULL DEFAULT 0, PRIMARY KEY (attribute_id))",
            'woocommerce_tax_rates' => "CREATE TABLE IF NOT EXISTS {$p}woocommerce_tax_rates (tax_rate_id bigint unsigned NOT NULL AUTO_INCREMENT, tax_rate_country varchar(2) NOT NULL DEFAULT '', tax_rate_state varchar(200) NOT NULL DEFAULT '', tax_rate varchar(8) NOT NULL DEFAULT '', tax_rate_name varchar(200) NOT NULL DEFAULT '', tax_rate_priority bigint unsigned NOT NULL, tax_rate_compound int NOT NULL DEFAULT 0, tax_rate_shipping int NOT NULL DEFAULT 1, tax_rate_order bigint unsigned NOT NULL, tax_rate_class varchar(200) NOT NULL DEFAULT '', PRIMARY KEY (tax_rate_id))",
            'woocommerce_shipping_zone_locations' => "CREATE TABLE IF NOT EXISTS {$p}woocommerce_shipping_zone_locations (location_id bigint unsigned NOT NULL AUTO_INCREMENT, zone_id bigint unsigned NOT NULL, location_code varchar(200) NOT NULL, location_type varchar(40) NOT NULL, PRIMARY KEY (location_id))",
            'woocommerce_shipping_zone_methods' => "CREATE TABLE IF NOT EXISTS {$p}woocommerce_shipping_zone_methods (zone_id bigint unsigned NOT NULL, instance_id bigint unsigned NOT NULL AUTO_INCREMENT, method_id varchar(200) NOT NULL, method_order bigint unsigned NOT NULL, is_enabled tinyint(1) NOT NULL DEFAULT 1, PRIMARY KEY (instance_id))",
            'woocommerce_shipping_zones' => "CREATE TABLE IF NOT EXISTS {$p}woocommerce_shipping_zones (zone_id bigint unsigned NOT NULL AUTO_INCREMENT, zone_name varchar(200) NOT NULL, zone_order bigint unsigned NOT NULL, PRIMARY KEY (zone_id))",
        ];

        if ($order_tables) {
            $statements['wc_order_addresses'] = "CREATE TABLE IF NOT EXISTS {$p}wc_order_addresses (id bigint unsigned NOT NULL AUTO_INCREMENT, order_id bigint unsigned NOT NULL, address_type varchar(20) DEFAULT NULL, first_name text, last_name text, company text, address_1 text, address_2 text, city text, state text, postcode text, country text, email varchar(320) DEFAULT NULL, phone varchar(100) DEFAULT NULL, PRIMARY KEY (id))";
            $statements['wc_order_operational_data'] = "CREATE TABLE IF NOT EXISTS {$p}wc_order_operational_data (id bigint unsigned NOT NULL AUTO_INCREMENT, order_id bigint unsigned DEFAULT NULL, created_via varchar(100) DEFAULT NULL, woocommerce_version varchar(20) DEFAULT NULL, prices_include_tax tinyint(1) DEFAULT NULL, coupon_usages_are_counted tinyint(1) DEFAULT NULL, download_permission_granted tinyint(1) DEFAULT NULL, cart_hash varchar(100) DEFAULT NULL, new_order_email_sent tinyint(1) DEFAULT NULL, order_key varchar(100) DEFAULT NULL, order_stock_reduced tinyint(1) DEFAULT NULL, date_paid_gmt datetime DEFAULT NULL, date_completed_gmt datetime DEFAULT NULL, shipping_tax_amount decimal(26,8) DEFAULT NULL, shipping_total_amount decimal(26,8) DEFAULT NULL, discount_tax_amount decimal(26,8) DEFAULT NULL, discount_total_amount decimal(26,8) DEFAULT NULL, recorded_sales tinyint(1) DEFAULT NULL, PRIMARY KEY (id))";
            $statements['wc_orders_meta'] = "CREATE TABLE IF NOT EXISTS {$p}wc_orders_meta (id bigint unsigned NOT NULL AUTO_INCREMENT, order_id bigint unsigned DEFAULT NULL, meta_key varchar(255) DEFAULT NULL, meta_value text, PRIMARY KEY (id))";
            $statements['wc_orders'] = "CREATE TABLE IF NOT EXISTS {$p}wc_orders (id bigint unsigned NOT NULL, status varchar(20) DEFAULT NULL, currency varchar(10) DEFAULT NULL, type varchar(20) DEFAULT NULL, tax_amount decimal(26,8) DEFAULT NULL, total_amount decimal(26,8) DEFAULT NULL, customer_id bigint unsigned DEFAULT NULL, billing_email varchar(320) DEFAULT NULL, date_created_gmt datetime DEFAULT NULL, date_updated_gmt datetime DEFAULT NULL, parent_order_id bigint unsigned DEFAULT NULL, payment_method varchar(100) DEFAULT NULL, payment_method_title text, transaction_id varchar(100) DEFAULT NULL, ip_address varchar(100) DEFAULT NULL, user_agent text, customer_note text, PRIMARY KEY (id))";
        }

        $this->without_temporary_tables(function () use ($statements, $wpdb, $p) {
            foreach ($statements as $table => $sql) {
                $wpdb->query($sql); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery -- test fixture DDL.
                $this->woo_tables[] = $p . $table;
            }
        });

        // The DDL above committed the test transaction; open a new one so the test's own rows still roll back.
        $wpdb->query('START TRANSACTION');
    }

    /**
     * Run DDL as real tables. The WordPress test suite turns CREATE and DROP into temporary-table
     * statements, which the schema checks in the migration code cannot see.
     *
     * @param callable $callback The DDL to run.
     * @return void
     */
    protected function without_temporary_tables(callable $callback): void
    {
        remove_filter('query', [$this, '_create_temporary_tables']);
        remove_filter('query', [$this, '_drop_temporary_tables']);

        try {
            $callback();
        } finally {
            add_filter('query', [$this, '_create_temporary_tables']);
            add_filter('query', [$this, '_drop_temporary_tables']);
        }
    }

    /**
     * Remove everything a WooCommerce fixture test created: content, users, options and tables.
     *
     * The deletes are committed before the tables are dropped. The migration engine commits its own
     * transactions and dropping a table commits too, so a rollback at the end of the test would not
     * undo them.
     *
     * @return void
     */
    protected function drop_woo_tables(): void
    {
        global $wpdb;

        $this->purge_woo_content();

        foreach ($this->woo_user_ids as $user_id) {
            wp_delete_user($user_id);
        }

        $this->woo_user_ids = [];
        delete_option('woocommerce_version');
        delete_option('woocommerce_custom_orders_table_enabled');

        $wpdb->query('COMMIT');

        $this->without_temporary_tables(function () use ($wpdb) {
            foreach ($this->woo_tables as $table) {
                $wpdb->query("DROP TABLE IF EXISTS {$table}"); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery -- test fixture DDL.
            }
        });

        $this->woo_tables = [];
        $wpdb->query('START TRANSACTION');
    }

    /**
     * Create customer users and remember them for cleanup.
     *
     * @param int $count How many to create.
     * @return int[] The user ids.
     */
    protected function woo_customers(int $count): array
    {
        $ids = self::factory()->user->create_many($count, ['role' => 'customer']);
        $this->woo_user_ids = array_merge($this->woo_user_ids, $ids);

        return $ids;
    }

    /**
     * Delete the WooCommerce-style posts, order notes and terms a test created.
     *
     * The migration engine commits its own transactions, which also commits fixture rows
     * created through WordPress functions, so tests remove them explicitly.
     *
     * @return void
     */
    protected function purge_woo_content(): void
    {
        $post_ids = get_posts([
            'post_type' => ['product', 'product_variation', 'shop_coupon', 'shop_order', 'shop_order_refund'],
            'post_status' => 'any',
            'numberposts' => -1,
            'fields' => 'ids',
        ]);

        foreach ($post_ids as $post_id) {
            wp_delete_post($post_id, true);
        }

        foreach (get_comments(['type' => 'order_note', 'fields' => 'ids']) as $comment_id) {
            wp_delete_comment($comment_id, true);
        }

        foreach (get_taxonomies() as $taxonomy) {
            if (in_array($taxonomy, ['product_cat', 'product_tag', 'product_brand'], true) || strpos($taxonomy, 'pa_') === 0) {
                foreach (get_terms(['taxonomy' => $taxonomy, 'hide_empty' => false, 'fields' => 'ids']) as $term_id) {
                    wp_delete_term($term_id, $taxonomy);
                }
            }
        }
    }

    /**
     * Insert a row into a WooCommerce table.
     *
     * @param string               $table The table name without prefix.
     * @param array<string, mixed> $row   The column values.
     * @return int The insert id.
     */
    protected function insert_woo_row(string $table, array $row): int
    {
        global $wpdb;

        $wpdb->insert($wpdb->prefix . $table, $row); // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- test fixture row.

        return (int) $wpdb->insert_id;
    }

    /**
     * Create a WooCommerce product post.
     *
     * @param array<string, mixed> $post Post fields to override.
     * @param array<string, mixed> $meta Post meta to save, keyed by WooCommerce meta key.
     * @return int The post id.
     */
    protected function woo_product(array $post = [], array $meta = []): int
    {
        $id = wp_insert_post(array_merge(['post_type' => 'product', 'post_status' => 'publish', 'post_title' => 'Product'], $post));

        foreach ($meta as $key => $value) {
            update_post_meta($id, $key, $value);
        }

        return $id;
    }

    /**
     * Create a WooCommerce term.
     *
     * @param string $taxonomy The taxonomy, for example "product_cat".
     * @param string $name     The term name.
     * @param int    $parent   The parent term id.
     * @return int The term id.
     */
    protected function woo_term(string $taxonomy, string $name, int $parent = 0): int
    {
        $result = wp_insert_term($name, $taxonomy, ['parent' => $parent]);

        return (int) $result['term_id'];
    }
}
