<?php

/**
 * Cart Resource
 *
 * @package Kirki\Ecommerce\App\Resources\Site\Cart
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Resources\Site\Cart;

use Kirki\Ecommerce\App\Resources\Cart\CartResource as BaseCartResource;
use Kirki\Ecommerce\App\Supports\Url;

class CartResource extends BaseCartResource
{
    public function to_array(): array
    {
        $resource = parent::to_array();

        $items = $resource['items'] ?? [];

        if (!empty($items)) {
            foreach ($items as &$item) {
                $item['product']['slug'] = Url::get_product_url($item['product']['slug']);
                $item['product']['media'] = $item['product']['media']['url'] ?? Url::get_product_fallback_image();

                $item['product']['max_quantity'] = null;

                if ( $item['product']['has_limit_per_order'] ) {
                    $item['product']['max_quantity'] = $item['product']['max_per_order'];
                } elseif ( $item['product']['track_inventory']) {
                    $item['product']['max_quantity'] = $item['product']['available_quantity'];
                }
            }
            $resource['items'] = $items;
        }

        return $resource;
    }
}