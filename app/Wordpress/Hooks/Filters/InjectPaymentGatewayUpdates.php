<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Filters;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Payment\PaymentGatewayUpdates;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Adds the payment gateway updates from the remote catalog to the WordPress plugin update data.
 *
 * The catalog is the only update source for a catalog gateway: an entry that
 * came from wordpress.org for the same plugin is replaced.
 *
 * @since 1.0.1
 */
class InjectPaymentGatewayUpdates extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function get_name(): string
    {
        return WPHookNames::PRE_SET_SITE_TRANSIENT_UPDATE_PLUGINS;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    /**
     * Add an update entry or a no-update entry for each installed catalog gateway.
     *
     * Runs on the `pre_set_site_transient_update_plugins` filter. A blocked
     * update is listed as no update, so WordPress shows no notice for it.
     *
     * @since 1.0.1
     *
     * @param mixed ...$args Filter arguments; the first is the plugin update data.
     * @return mixed The update data.
     */
    public function handle(...$args)
    {
        $transient = $args[0];

        if (!is_object($transient)) {
            return $transient;
        }

        foreach ((new PaymentGatewayUpdates())->states() as $state) {
            if ($state['installed_version'] === null) {
                continue;
            }

            $plugin = $state['plugin'];
            $item = $this->update_item($state);

            unset($transient->response[$plugin], $transient->no_update[$plugin]);

            if ($state['update_available']) {
                $transient->response[$plugin] = $item;
            } else {
                $transient->no_update[$plugin] = $item;
            }
        }

        return $transient;
    }

    /**
     * Build the update data WordPress reads for one gateway plugin.
     *
     * @since 1.0.1
     *
     * @param array<string, mixed> $state Update state from PaymentGatewayUpdates.
     * @return object
     */
    protected function update_item(array $state)
    {
        $gateway = $state['gateway'];
        $has_update = $state['update_available'];

        return (object) [
            'id' => $state['plugin'],
            'slug' => $gateway['slug'],
            'plugin' => $state['plugin'],
            'new_version' => $has_update ? $gateway['version'] : $state['installed_version'],
            'url' => '',
            'package' => $has_update ? $gateway['download_url'] : '',
            'icons' => $gateway['icon_url'] !== '' ? ['svg' => $gateway['icon_url']] : [],
            'banners' => [],
            'banners_rtl' => [],
            'tested' => '',
            'requires' => $gateway['requires_wp'],
            'requires_php' => $gateway['requires_php'],
        ];
    }
}
