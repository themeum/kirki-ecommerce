<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;

/**
 * Detects WooCommerce and tells whether its installed version can be migrated from.
 *
 * @since 1.0.0
 */
class VersionProbe
{
    /** The lowest WooCommerce version that is read. It is the first release with the order storage tables. */
    public const MINIMUM_VERSION = '7.0.0';

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
     * Check whether WooCommerce is installed. It does not have to be active.
     *
     * WooCommerce saves its version in an option when it installs, and the option stays
     * after the plugin is deactivated. Its core tables are the second sign.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_installed()
    {
        return $this->version() !== null || $this->database->has_table('woocommerce_order_items');
    }

    /**
     * Get the installed WooCommerce version.
     *
     * @since 1.0.0
     *
     * @return string|null Null when no version is saved.
     */
    public function version()
    {
        $version = get_option('woocommerce_version');

        return is_string($version) && $version !== '' ? $version : null;
    }

    /**
     * Check whether the installed version is at or above the minimum.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_supported()
    {
        $version = $this->version();

        return $version !== null && version_compare($version, static::MINIMUM_VERSION, '>=');
    }
}
