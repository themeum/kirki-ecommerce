<?php

/**
 * Add noindex to product pages that must stay out of search results
 *
 * @package Kirki\Ecommerce\App\Hooks\Filters
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Filters;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Supports\ProductSeo;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Adds `noindex` to the robots directive of unpublished and preview product pages.
 *
 * @since 1.0.0
 */
class AddProductRobots extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return WPHookNames::WP_ROBOTS;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    /**
     * Add `noindex` when the product page is not indexable.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments; the first is the robots directives array.
     * @return array<string, mixed> The robots directives.
     */
    public function handle(...$args)
    {
        $robots = $args[0];
        $seo = ProductSeo::current();

        if ($seo !== null && !$seo['indexable']) {
            $robots['noindex'] = true;
        }

        return $robots;
    }
}
