<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Filters;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Payment\PaymentGatewayCatalog;
use Kirki\Ecommerce\App\Payment\PaymentGatewayUpdates;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Checks the SHA-256 of every payment gateway package that WordPress downloads from the catalog server.
 *
 * This covers updates from the Plugins page, Dashboard > Updates and
 * auto-updates. Packages from other servers are left to WordPress.
 *
 * @since 1.0.1
 */
class VerifyPaymentGatewayPackage extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function get_name(): string
    {
        return WPHookNames::UPGRADER_PRE_DOWNLOAD;
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
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function get_args_count()
    {
        return 2;
    }

    /**
     * Download and verify a package from the catalog server.
     *
     * Runs on the `upgrader_pre_download` filter. A package URL under the
     * catalog base URL is always verified: a URL that is not in the catalog,
     * a catalog that cannot be loaded or a hash mismatch gives an error.
     *
     * @since 1.0.1
     *
     * @param mixed ...$args Filter arguments: the reply so far and the package URL.
     * @return mixed Path of the verified file, an error, or the reply without a change.
     */
    public function handle(...$args)
    {
        list($reply, $package) = array_pad($args, 2, null);
        $base_url = (new PaymentGatewayCatalog())->base_url();

        if (!is_string($package) || strpos($package, $base_url . '/') !== 0) {
            return $reply;
        }

        return (new PaymentGatewayUpdates())->verified_package($package);
    }
}
