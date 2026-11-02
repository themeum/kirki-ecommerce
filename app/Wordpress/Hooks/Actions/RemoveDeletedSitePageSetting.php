<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Clears a site page setting when its WordPress page is deleted permanently.
 *
 * @since 1.0.0
 */
class RemoveDeletedSitePageSetting extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return WPHookNames::DELETED_POST;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return HookTypes::ACTION;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_args_count()
    {
        return 2;
    }

    /**
     * Unset every site page setting that points to the deleted page.
     *
     * Runs on the `deleted_post` action, which fires with the post ID and the
     * deleted post. Does nothing for posts that are not pages.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments: the post ID and the deleted \WP_Post.
     * @return void
     */
    public function handle(...$args)
    {
        [$post_id, $post] = $args;

        if (empty($post) || $post->post_type !== 'page') {
            return;
        }

        foreach (array_keys(Utils::get_site_pages()) as $settings_key) {
            if ((int) Settings::get($settings_key) === (int) $post_id) {
                Settings::update($settings_key, 0);
            }
        }
    }
}
