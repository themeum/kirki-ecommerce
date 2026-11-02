<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe;

defined('ABSPATH') || exit;

/**
 * Finds known WooCommerce extension plugins and says whether their data is migrated.
 *
 * @since 1.0.0
 */
class ExtensionDetector
{
    public const STATUS_SUPPORTED = 'supported';
    public const STATUS_NOT_MIGRATED = 'not_migrated';

    /**
     * Get the known extensions, keyed by plugin folder name.
     *
     * @since 1.0.0
     *
     * @return array<string, array{label: string, status: string}>
     */
    public function known()
    {
        return [
            'woocommerce-subscriptions' => ['label' => __('WooCommerce Subscriptions', 'kirki-ecommerce'), 'status' => static::STATUS_NOT_MIGRATED],
            'woocommerce-bookings' => ['label' => __('WooCommerce Bookings', 'kirki-ecommerce'), 'status' => static::STATUS_NOT_MIGRATED],
            'woocommerce-memberships' => ['label' => __('WooCommerce Memberships', 'kirki-ecommerce'), 'status' => static::STATUS_NOT_MIGRATED],
            'woocommerce-product-bundles' => ['label' => __('Product Bundles', 'kirki-ecommerce'), 'status' => static::STATUS_NOT_MIGRATED],
            'woocommerce-composite-products' => ['label' => __('Composite Products', 'kirki-ecommerce'), 'status' => static::STATUS_NOT_MIGRATED],
            'woocommerce-product-addons' => ['label' => __('Product Add-Ons', 'kirki-ecommerce'), 'status' => static::STATUS_NOT_MIGRATED],
            'wordpress-seo' => ['label' => __('Yoast SEO', 'kirki-ecommerce'), 'status' => static::STATUS_SUPPORTED],
            'seo-by-rank-math' => ['label' => __('Rank Math SEO', 'kirki-ecommerce'), 'status' => static::STATUS_SUPPORTED],
        ];
    }

    /**
     * Get the known extensions that are installed.
     *
     * @since 1.0.0
     *
     * @return array<int, array{slug: string, label: string, status: string}>
     */
    public function detect()
    {
        $installed = $this->installed_folders();
        $found = [];

        foreach ($this->known() as $slug => $extension) {
            if (in_array($slug, $installed, true)) {
                $found[] = ['slug' => $slug, 'label' => $extension['label'], 'status' => $extension['status']];
            }
        }

        return $found;
    }

    /**
     * Check whether a supported SEO plugin is installed.
     *
     * @since 1.0.0
     *
     * @param string $slug The plugin folder name.
     * @return bool
     */
    public function has(string $slug)
    {
        return in_array($slug, $this->installed_folders(), true);
    }

    /**
     * Get the folder names of the installed plugins.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    protected function installed_folders()
    {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $folders = [];

        foreach (array_keys(get_plugins()) as $plugin_file) {
            $folders[] = strpos($plugin_file, '/') !== false ? dirname($plugin_file) : basename($plugin_file, '.php');
        }

        return $folders;
    }
}
