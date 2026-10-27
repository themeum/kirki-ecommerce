<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Supports\Utils;

/**
 * Creates the missing store pages and publishes the store pages that are not published, the same as the admin Fix action.
 *
 * @since 1.0.0
 */
class FixStorePagesTool extends StoreWriteTool
{
    /** @var bool */
    protected $idempotent = true;

    /** @var string */
    protected $description = 'Repair the store pages, such as shop, cart, checkout and account, the same as the Fix action in the admin: create and link each missing page, '
        . 'and publish each linked page that is not published. When all pages are fine, the tool says so and gives no token. '
        . 'Call without "confirmation_token" to get a preview and a token, then call again with the token.';

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return [];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        return [];
    }

    /**
     * Get the state of each store page.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        $pages = [];

        foreach (Utils::get_site_pages() as $settings_key => $title) {
            $page_id = (int) Settings::get($settings_key);
            $exists = !empty($page_id) && get_post_type($page_id) === 'page';

            $pages[] = [
                'settings_key' => $settings_key,
                'title' => $title,
                'page_id' => $exists ? $page_id : null,
                'post_status' => $exists ? get_post_status($page_id) : null,
            ];
        }

        return $pages;
    }

    /**
     * List the pages to create and to publish.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        $create = [];
        $publish = [];

        foreach ($target as $page) {
            if ($page['page_id'] === null) {
                $create[] = $page['title'];
            } elseif ($page['post_status'] !== 'publish') {
                $publish[] = ['page_id' => $page['page_id'], 'title' => $page['title'], 'current_status' => $page['post_status']];
            }
        }

        if (empty($create) && empty($publish)) {
            return Response::structured([
                'status' => 'nothing_to_do',
                'message' => __('All store pages exist and are published. Nothing to fix.', 'kirki-ecommerce'),
            ]);
        }

        return ['pages_to_create' => $create, 'pages_to_publish' => $publish];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        return $this->hash_values($target);
    }

    /**
     * Run the admin Fix action and get the store pages.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        Utils::generate_site_pages();

        return [
            'pages' => array_map(function ($page) {
                return [
                    'title' => $page['title'],
                    'page_id' => $page['page_id'],
                    'post_status' => $page['post_status'],
                    'url' => $page['page_id'] === null ? null : get_permalink($page['page_id']),
                ];
            }, $this->target([])),
        ];
    }
}
