<?php

namespace Kirki\Ecommerce\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Wordpress\BaseHook;

/**
 * This hook is responsible for enqueueing the admin script.
 *
 * @since 1.0.0
 */
class EnqueueAdminScripts extends BaseHook
{
    public function get_name()
    {
        return HookNames::ADMIN_ENQUEUE_SCRIPT;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        wp_enqueue_script('wp-tinymce');
        wp_enqueue_editor();
        wp_enqueue_media();
        wp_enqueue_script(
            KIRKI_ECOMMERCE_PREFIX . '-admin',
            KIRKI_ECOMMERCE_ASSETS_URL . '/js/admin.js',
            [],
            KIRKI_ECOMMERCE_VERSION,
            true
        );
    }
}
