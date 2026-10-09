<?php

namespace Kirki\Ecommerce\App\Resources\Site\Cart;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Resources\Cart\CartResource as BaseCartResource;

/**
 * Site resource for an cart page on the storefront.
 *
 * @since 1.0.0
 */
class CartResource extends BaseCartResource
{

    /**
     * Convert the order activity resource to an array.
     *
     * Exposes only the activity type and creation time, unlike the admin resource.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The activity type and creation date.
     */
    public function to_array()
    {

        if (!$this->resource) {
            return [];
        }

        $data = parent::to_array();

        $data['invalid_items'] = $this->resolve_invalid_items($data);

        return $data;
    }


    /**
     * Resolve invalid items in the cart.
     *
     * @since 1.0.0
     *
     * @param array $resource Cart resource.
     *
     * @return array<string, mixed> The invalid items.
     */
    private function resolve_invalid_items($resource): array
    {

        $invalid_items = [];

        if (!empty($resource)) {
            $items = $resource['items'] ?? [];
            foreach ($items as $item) {
                $product = $item['product'] ?? [];

                if (isset($product['in_stock']) && !$product['in_stock']) {
                    $invalid_items[$item['id']] =  __('Out of Stock', 'kirki-ecommerce');
                }

                if (isset($product['is_available']) && !$product['is_available']) {
                    $invalid_items[$item['id']] =  __('Not Available', 'kirki-ecommerce');
                }
            }
        }

        return $invalid_items;
    }
}
