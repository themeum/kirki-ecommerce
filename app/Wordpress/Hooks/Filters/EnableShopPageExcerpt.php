<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Filters;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Constants\PageKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use WP_Post;

/**
 * Adds the excerpt field to the editor of the shop page only.
 *
 * @since 1.0.0
 */
class EnableShopPageExcerpt extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return WPHookNames::USE_BLOCK_EDITOR_FOR_POST;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return HookTypes::FILTER;
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
     * Enable page excerpts when the editor opens the shop page.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments: whether to use the block editor and the \WP_Post.
     * @return bool Whether to use the block editor, unchanged.
     */
    public function handle(...$args)
    {
        [$use_block_editor, $page] = $args;

        if (!$page instanceof WP_Post || $page->post_type !== 'page') {
            return $use_block_editor;
        }

        $shop_page_id = (int) Settings::get('advance.pages.' . PageKeys::SHOP);

        if ($shop_page_id > 0 && $page->ID === $shop_page_id) {
            add_post_type_support('page', 'excerpt');
        }

        return $use_block_editor;
    }
}
