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

use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

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
        $site_js_handler = 'kirki-ecommerce-site-scripts';
        $site_css_handler = 'kirki-ecommerce-site-styles';

        wp_enqueue_script($site_js_handler, Assets::get_url('js/site.js'), [], false, true);
        wp_enqueue_style($site_css_handler, Assets::get_url('css/site.css'));

        wp_add_inline_script($site_js_handler, Assets::get_kirki_ecommerce_configs(), 'before');
    }
}
