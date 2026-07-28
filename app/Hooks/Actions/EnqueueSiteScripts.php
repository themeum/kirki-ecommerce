<?php

/**
 * Enqueue Site Scripts
 *
 * @package Kirki\Ecommerce\App\Hooks\Actions
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Actions;

use Kirki\Ecommerce\Wordpress\BaseHook;
use Kirki\Ecommerce\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Wordpress\Constants\HookTypes;

/**
 * Class EnqueueSiteScripts
 *
 * @since 1.0.0
 */
class EnqueueSiteScripts extends BaseHook
{
    /**
     * Get the hook name.
     *
     * @since 1.0.0
     *
     * @return string The hook name.
     */
    public function get_name(): string
    {
        return HookNames::WP_ENQUEUE_SCRIPT;
    }

    /**
     * Get the hook type.
     *
     * @since 1.0.0
     *
     * @return string The hook type.
     */
    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    /**
     * Get the hook priority.
     *
     * @since 1.0.0
     *
     * @return int The hook priority.
     */
    public function get_priority(): int
    {
        return 10;
    }

    /**
     * Handle the hook.
     *
     * @since 1.0.0
     *
     * @param array $args Hook arguments.
     *
     * @return void
     */
    public function handle(...$args)
    {
        wp_enqueue_style('kirki-ecommerce-site-core', KIRKI_ECOMMERCE_ASSETS_URL . '/css/core.css');
    }
}
