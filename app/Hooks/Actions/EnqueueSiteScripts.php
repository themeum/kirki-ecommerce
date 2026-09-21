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

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\HtmlStyle;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\app;

/**
 * Enqueues the storefront script and stylesheet on wp_enqueue_scripts.
 *
 * @since 1.0.0
 */
class EnqueueSiteScripts extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return WPHookNames::WP_ENQUEUE_SCRIPT;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_priority(): int
    {
        return 10;
    }

    /**
     * Enqueue the site script and stylesheet with their inline styles, config and translations.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments, unused.
     * @return void
     */
    public function handle(...$args)
    {
        $site_js_handler = 'kirki-ecommerce-site-scripts';
        $site_css_handler = 'kirki-ecommerce-site-styles';

        wp_enqueue_script($site_js_handler, Assets::get_url('js/site.js'), ['wp-i18n'], app()->version(), true);
        wp_enqueue_style($site_css_handler, Assets::get_url('css/site.css'), [], app()->version());

        wp_add_inline_style($site_css_handler, HtmlStyle::build_style_block(HtmlStyle::richtext_styles()));

        wp_add_inline_script($site_js_handler, Assets::get_kirki_ecommerce_configs(), 'before');

        // Set script translation data for wp-i18n
        wp_set_script_translations($site_js_handler, 'kirki-ecommerce', KIRKI_ECOMMERCE_PLUGIN_PATH . '/languages');
    }
}
