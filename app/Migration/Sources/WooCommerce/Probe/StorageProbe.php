<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;

/**
 * Detects where WooCommerce keeps its orders: the order tables or the posts tables.
 *
 * @since 1.0.0
 */
class StorageProbe
{
    /** @var WooCommerceDatabase */
    protected $database;

    /**
     * Create the probe.
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
     * Check whether the order tables are the source of truth for orders.
     *
     * The tables can exist while the store still uses posts, so the setting must also be on.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function uses_order_tables()
    {
        return $this->database->has_table('wc_orders')
            && get_option('woocommerce_custom_orders_table_enabled') === 'yes';
    }
}
