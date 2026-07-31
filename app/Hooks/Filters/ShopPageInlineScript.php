<?php

/**
 * Inline Script for Shop Page.
 *
 * @package Kirki\Ecommerce\App\Hooks\Filters
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Filters;

use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\view_data;

/**
 * Class ShopPageInlineScript.
 *
 * @since 1.0.0
 */
class ShopPageInlineScript extends BaseHook
{
    public function get_name(): string
    {
        return 'kirki_ecommerce_config_data';
    }

    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    public function handle(...$args)
    {
        $config = $args[0];

        if (!Route::is('shop.single')) {
            return $config;
        }

        $product = view_data();
        $config['product'] = $product;

        return $config;
    }
}
