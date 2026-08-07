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

use Kirki\Ecommerce\App\Constants\Cart;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\view_data;

/**
 * Class PageInlineScript.
 *
 * @since 1.0.0
 */
class PageInlineScript extends BaseHook
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

        // Get all variant IDs in cart for dynamic checking
        $cart_variant_ids = app()->make(CartService::class)->get_cart_variant_ids();
        $config['cart_variant_ids'] = $cart_variant_ids;
        $config['cart_token_cookie_name'] = Cart::COOKIE_TOKEN;
        $config['cart_token_header_name'] = Cart::HEADER_TOKEN;

        if (Route::is('cart')) {
            $cart = view_data('cart');
            $pricing = $cart['pricing'] ?? [];
            $items = $cart['items'] ?? [];
            $cart_config = array(
                'items_count' => $cart['items_count'],
                'pricing' => (object) array(
                    'subtotal_formatted' => $pricing['subtotal_formatted'],
                    'total_formatted' => $pricing['total_formatted'],
                ),
                'items' => array_map(fn($item) => (object) array(
                    'id' => $item['id'],
                    'total_formatted' => $item['total_formatted'],
                ), $items),
            );
            $config['cart'] = $cart_config;
            return $config;
        }

        // Add cart data for checkout page
        if (Route::is('checkout')) {
            $config = $this->set_checkout_page_data(view_data(), $config);
        } elseif (Route::is('shop.single')) {
            $config = $this->set_shop_single_page_data(view_data(), $config);
        }

        return $config;
    }

    /**
     * Add checkout page data to the inline config.
     *
     * @since 1.0.0
     *
     * @param mixed $view_data  Data from the view context.
     * @param array $config     Existing config array.
     *
     * @return array Updated config.
     */
    protected function set_checkout_page_data($view_data, $config)
    {
        $data    = (object) $view_data;
        $cart    = $data->cart ?? null;
        $pricing = $cart['pricing'] ?? [];

        $discount_details = $pricing['discount_details'] ?? null;
        $discount_total   = $pricing['discount_total'] ?? null;
        $has_discount     = $discount_total && !$discount_total->isZero();

        $config['checkout_cart'] = [
            'items'                      => $cart['items'] ?? [],
            'is_billing_same_as_shipping' => $cart['is_billing_same_as_shipping'] ?? false,
            'pricing'                    => [
                'subtotal_formatted'       => $pricing['subtotal_formatted'] ?? null,
                'shipping_total'           => $pricing['shipping_total'] ?? null,
                'shipping_total_formatted' => $pricing['shipping_total_formatted'] ?? null,
                'discount_total'           => $discount_total,
                'discount_total_formatted' => $has_discount ? $pricing['discount_total_formatted'] : null,
                'total_formatted'          => $pricing['total_formatted'] ?? null,
                'discount_details'         => $discount_details ? [
                    'code'                       => $discount_details['code'] ?? null,
                    'discount_value_type'        => $discount_details['discount_value_type'] ?? null,
                    'discount_amount_percentage' => $discount_details['discount_amount_percentage'] ?? null,
                    'discount_amount_fixed'      => $discount_details['discount_amount_fixed'] ?? null,
                ] : null,
            ],
            'available_shipping_methods' => $cart['available_shipping_methods'] ?? [],
            'shipping_method'            => $cart['shipping_method'] ?? null,
        ];

        $config['currency']  = $cart['currency']['code'] ?? 'USD';
        $config['countries'] = $data->countries ?? [];

        return $config;
    }

    /**
     * Add shop single page data to the inline config.
     *
     * @since 1.0.0
     *
     * @param mixed $view_data  Data from the view context.
     * @param array $config     Existing config array.
     *
     * @return array Updated config.
     */
    protected function set_shop_single_page_data($view_data, $config)
    {
        $product    = $view_data;
        $media      = $product['media'] ?? [];
        $attributes = $product['attributes'] ?? [];
        $variants   = $product['variants'] ?? [];

        // Prepare images for Alpine.js
        $images = [];
        foreach ($media as $media_item) {
            $images[] = ['id' => $media_item['id'] ?? 0, 'url' => $media_item['url']];
        }

        // Build a lookup map: [attribute_value_id] => ['name', 'value', 'color']
        $attribute_value_map = [];
        foreach ($attributes as $attribute) {
            $attr_name = $attribute['name'] ?? '';
            foreach ($attribute['values'] ?? [] as $value) {
                $attribute_value_map[$value['id'] ?? 0] = [
                    'name'  => $attr_name,
                    'value' => $value['value'] ?? '',
                    'color' => $value['color'] ?? null,
                ];
            }
        }

        // Prepare variants for Alpine.js
        $variants_data = [];
        foreach ($variants as $v) {
            $variant_attrs = [];

            foreach ($v['attribute_values'] ?? [] as $attr_value_id) {
                if (isset($attribute_value_map[$attr_value_id])) {
                    $variant_attrs[] = $attribute_value_map[$attr_value_id];
                }
            }

            $variants_data[] = [
                'id'             => $v['id'] ?? 0,
                'product_id'     => $product['id'] ?? 0,
                'price'          => is_object($v['price']) && method_exists($v['price'], 'toFloat')
                    ? (float) $v['price']->toFloat()
                    : (float) ($v['price'] ?? 0),
                'compare_price'  => isset($v['sale_price'])
                    ? (is_object($v['sale_price']) && method_exists($v['sale_price'], 'toFloat')
                        ? (float) $v['sale_price']->toFloat()
                        : (float) $v['sale_price'])
                    : null,
                'stock'          => (int) ($v['available_quantity'] ?? 0),
                'attributes'     => $variant_attrs,
                'available'      => ($v['available_quantity'] ?? 0) > 0,
                'image'          => $v['media']['url'] ?? null,
            ];
        }

        $config['product_images']   = $images;
        $config['product_variants'] = $variants_data;

        return $config;
    }
}
