<?php

namespace Kirki\Ecommerce\App\Payment;

defined('ABSPATH') || exit;

use Exception;
use Kirki\Ecommerce\Framework\Supports\Facades\File;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;
use WP_Error;

/**
 * Finds updates for the installed payment gateway plugins from the remote catalog.
 *
 * A gateway plugin lives at `<slug>/<slug>.php`. It has an update when the
 * catalog version is greater than its `Version` header. An update is blocked
 * when the store does not meet the catalog `requires_*` values.
 *
 * @since 1.0.1
 */
class PaymentGatewayUpdates
{
    /** @var PaymentGatewayCatalog */
    protected $catalog;

    /**
     * Create the update finder.
     *
     * @since 1.0.1
     *
     * @param PaymentGatewayCatalog|null $catalog Remote gateway catalog; the default one is used when omitted.
     */
    public function __construct(?PaymentGatewayCatalog $catalog = null)
    {
        $this->catalog = $catalog ?: new PaymentGatewayCatalog();
    }

    /**
     * Get the plugin basename of a catalog gateway.
     *
     * @since 1.0.1
     *
     * @param string $slug Gateway plugin slug.
     * @return string Plugin basename, e.g. "kirki-stripe/kirki-stripe.php".
     */
    public static function plugin_basename(string $slug)
    {
        return $slug . '/' . $slug . '.php';
    }

    /**
     * Get the update state of each catalog gateway, keyed by gateway ID.
     *
     * A catalog that cannot be loaded gives an empty list, so a WordPress
     * update check never fails because of the gateway server.
     *
     * @since 1.0.1
     *
     * @return array<string, array<string, mixed>> Each state has gateway, plugin, installed_version, update_available and update_blocked_reason.
     */
    public function states()
    {
        try {
            $gateways = $this->catalog->all();
        } catch (Exception $exception) {
            return [];
        }

        require_once ABSPATH . 'wp-admin/includes/plugin.php';

        $plugins = get_plugins();
        $states = [];

        foreach ($gateways as $gateway) {
            $states[$gateway['id']] = $this->state($gateway, $plugins);
        }

        return $states;
    }

    /**
     * Get the update state of one gateway.
     *
     * @since 1.0.1
     *
     * @param array<string, string>               $gateway Catalog entry.
     * @param array<string, array<string, mixed>> $plugins Installed plugins, as `get_plugins()` returns them.
     * @return array<string, mixed>
     */
    public function state(array $gateway, array $plugins)
    {
        $plugin = static::plugin_basename($gateway['slug']);
        $installed_version = isset($plugins[$plugin]['Version']) ? (string) $plugins[$plugin]['Version'] : null;
        $is_newer = $installed_version !== null
            && $gateway['version'] !== ''
            && version_compare($gateway['version'], $installed_version, '>');
        $blocked_reason = $is_newer ? $this->blocked_reason($gateway) : null;

        return [
            'gateway' => $gateway,
            'plugin' => $plugin,
            'installed_version' => $installed_version,
            'update_available' => $is_newer && $blocked_reason === null,
            'update_blocked_reason' => $blocked_reason,
        ];
    }

    /**
     * Get the first requirement of a gateway that the store does not meet.
     *
     * @since 1.0.1
     *
     * @param array<string, string> $gateway Catalog entry.
     * @return string|null Null when all requirements are met.
     */
    public function blocked_reason(array $gateway)
    {
        $requirements = [
            [
                $gateway['requires_kirki'] ?? '',
                KIRKI_ECOMMERCE_VERSION,
                /* translators: %s: minimum Kirki Ecommerce version. */
                __('Requires Kirki %s', 'kirki-ecommerce'),
            ],
            [
                $gateway['requires_wp'] ?? '',
                get_bloginfo('version'),
                /* translators: %s: minimum WordPress version. */
                __('Requires WordPress %s', 'kirki-ecommerce'),
            ],
            [
                $gateway['requires_php'] ?? '',
                PHP_VERSION,
                /* translators: %s: minimum PHP version. */
                __('Requires PHP %s', 'kirki-ecommerce'),
            ],
        ];

        foreach ($requirements as list($required, $running, $message)) {
            if ($required !== '' && version_compare($running, $required, '<')) {
                return sprintf($message, $required);
            }
        }

        return null;
    }

    /**
     * Download a catalog gateway package and check its checksum.
     *
     * @since 1.0.1
     *
     * @param string $download_url Package URL. It must be a catalog download URL.
     * @return string|WP_Error Path of the verified temporary file, or the reason it failed.
     */
    public function verified_package(string $download_url)
    {
        try {
            $gateway = $this->catalog->find_by_download_url($download_url);
        } catch (Exception $exception) {
            return new WP_Error('kirki_payment_package_unverified', $exception->getMessage());
        }

        if (!$gateway) {
            return new WP_Error(
                'kirki_payment_package_unknown',
                __('The payment method package is not in the payment gateway list.', 'kirki-ecommerce')
            );
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';

        $package_file = wp_tempnam($download_url);
        $response = Http::with_options(['timeout' => 300, 'stream' => true, 'filename' => $package_file])
            ->get($download_url);

        if (!$response->successful()) {
            File::delete($package_file);

            return new WP_Error('kirki_payment_package_download_failed', __('Could not download the payment method package.', 'kirki-ecommerce'));
        }

        if (!hash_equals($gateway['sha256'], File::hash($package_file, 'sha256'))) {
            File::delete($package_file);

            return new WP_Error('kirki_payment_package_integrity', __('The payment method package failed the integrity check.', 'kirki-ecommerce'));
        }

        return $package_file;
    }
}
