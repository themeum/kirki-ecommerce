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
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;
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
        $config['header_skip_tax'] = Cart::HEADER_SKIP_TAX;

        // Add cart data for checkout page
        if (Route::is('checkout')) {
            $config = $this->set_checkout_page_data(view_data(), $config);
        } elseif (Route::is('shop.single')) {
            $config = $this->set_shop_single_page_data(view_data(), $config);
        } elseif (Route::is('cart')) {
            $config = $this->set_cart_page_data(view_data(), $config);
        } elseif (Route::is('account.addresses')) {
            $config = $this->set_addresses_page_data(view_data(), $config);
        } elseif ( Route::is('account.orders.details') ) {
            $config = $this->set_orders_details_page_data(view_data(), $config);
        }

        return $config;
    }

    /**
     * Set Order details product items data to the inline config.
     * 
     * @since 1.0.0
     * 
     * @param mixed $view_data  Data from the view context.
     * @param array $config     Existing config array.
     *
     * @return array Updated config.
     */
    protected function set_orders_details_page_data($view_data, $config) {

        $order = $view_data['order'] ?? null;

        if ( ! isset( $order['items'] ) || ! isset( $order['item_product_data'] ) ) {
            return $config;
        }

        $items = $order['items']->to_array();
        $items_product_data = $order['item_product_data'];

        $products_data = [];
        foreach ($items as $key => $item) {
            $base_price_obj = $item['base_price_money_object'] ?? null;
            $item_product = $items_product_data[$key]['product'] ?? [];
            $categories = $item_product['categories'] ?? [];
            $product_image = $item_product['media'][0] ?? [];
            $product_first_image = MediaAttachment::make($product_image['ID'] ?? 0);
            $image = $item['image'] ? $item['image'] : $product_first_image;

            $product['name'] = $item['product_name'] ?? '';
            $product['image_url'] = $image['url'] ?? Assets::get_url('images/product-fallback.webp');
            $product['category'] = $categories[count($categories) - 1]['name'] ?? '';
            $product['variant'] = $item['variant_name'] ?? '';
            $product['price'] = $base_price_obj->display ?? '';
            $product['quantity'] = $item['quantity'] ?? 0;
            $product['url'] = Url::get_product_url($item_product['slug'] ?? '');

            $products_data[] = $product;
        }

        $config['order_details_items'] = array_slice($products_data, 0, 3);
        if(count($products_data) > 3) {
            $config['order_details_more_items'] = array_slice($products_data, 3);
            $config['order_details_more_items_count'] = count($products_data) - 3;
        }

        return $config;
    }
    

    /**
     * Add addresses page data to the inline config.
     *
     * @since 1.0.0
     *
     * @param mixed $view_data  Data from the view context.
     * @param array $config     Existing config array.
     *
     * @return array Updated config.
     */
    protected function set_addresses_page_data($view_data, $config)
    {
        $data             = (object) $view_data;
        $customer         = $data->customer->get_customer() ?? null;
        $billing_address  = $data->billing_address ?? [];
        $shipping_address = $data->shipping_address ?? [];

        $config['countries']                   = $data->countries ?? Utils::get_countries();
        $config['customer_id']                 = $customer->id ?? 0;
        $config['addresses']                   = [
            'billing'  => $this->format_address($billing_address),
            'shipping' => $this->format_address($shipping_address),
        ];

        return $config;
    }

    /**
     * Format address model or data to an array.
     *
     * @since 1.0.0
     *
     * @param mixed $address Address model or array.
     *
     * @return array
     */
    protected function format_address($address): array
    {
        if (empty($address)) {
            return [];
        }

        if (is_object($address) && method_exists($address, 'to_array')) {
            return $address->to_array();
        }

        return (array) $address;
    }

    /**
     * Add cart page data to the inline config.
     *
     * @since 1.0.0
     *
     * @param mixed $view_data  Data from the view context.
     * @param array $config     Existing config array.
     *
     * @return array Updated config.
     */
    protected function set_cart_page_data($view_data, $config)
    {
        $cart = $view_data['cart'];
        $pricing = $cart['pricing'] ?? [];
        $items = $cart['items'] ?? [];
        $cart_config = array(
            'items_count' => $cart['items_count'] ?? 0,
            'pricing' => (object) array(
                'display_subtotal_money_object' => (object) array(
                    'display' => $pricing['display_subtotal_money_object']->display ?? Money::format_from_decimal(0),
                ),
                'display_total_money_object' =>  (object) array(
                    'display' => $pricing['display_total_money_object']->display ?? Money::format_from_decimal(0),
                ),
            ),
            'items' => array_map(fn($item) => (object) array(
                'id' => $item['id'],
                'display_product_total_money_object' => (object) array(
                    'display' => $item['display_product_total_money_object']->display ?? Money::format_from_decimal(0),
                ),
                'display_total_money_object' => (object) array(
                    'display' => $item['display_total_money_object']->display ?? Money::format_from_decimal(0),
                ),
            ), $items),
        );
        $config['cart'] = $cart_config;

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

        $config['checkout_cart'] = [
            'items'                       => $cart['items'] ?? [],
            'is_billing_same_as_shipping' => $cart['is_billing_same_as_shipping'] ?? false,
            'pricing'                     => [
                'discount_details'                   => $discount_details ? [
                    'code'                       => $discount_details['code'] ?? null,
                    'title'                      => $discount_details['title'] ?? null,
                    'discount_value_type'        => $discount_details['discount_value_type'] ?? null,
                    'discount_amount_percentage' => $discount_details['discount_amount_percentage'] ?? null,
                    'base_discount_amount_fixed' => $discount_details['base_discount_amount_fixed'] ?? null,
                ] : null,
                'display_subtotal_money_object'      => $pricing['display_subtotal_money_object'] ?? null,
                'display_tax_total_money_object'     => $pricing['display_tax_total_money_object'] ?? null,
                'display_discount_total_money_object' => $pricing['display_discount_total_money_object'] ?? null,
                'display_shipping_subtotal_money_object' => $pricing['display_shipping_subtotal_money_object'] ?? null,
                'display_shipping_tax_money_object'  => $pricing['display_shipping_tax_money_object'] ?? null,
                'display_shipping_discount_money_object' => $pricing['display_shipping_discount_money_object'] ?? null,
                'display_shipping_total_money_object' => $pricing['display_shipping_total_money_object'] ?? null,
                'display_total_money_object'         => $pricing['display_total_money_object'] ?? null,
            ],
            'available_shipping_methods'  => $cart['available_shipping_methods'] ?? [],
            'shipping_method'             => $cart['shipping_method'] ?? null,
        ];

        $config['currency']  = $cart['currency']['code'] ?? 'USD';
        $config['countries'] = $data->countries ?? [];

        if (is_user_logged_in()) {
            $current_user = wp_get_current_user();
            $config['current_user'] = [
                'id'         => $current_user->ID,
                'name'       => trim($current_user->first_name . ' ' . $current_user->last_name) ?: $current_user->display_name,
                'email'      => $current_user->user_email,
                'avatar_url' => get_avatar_url($current_user->ID, ['size' => 96]),
            ];
        } else {
            $config['current_user'] = null;
        }

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
        $product_id        = intval($product['id'] ?? 0);
        $inventory_service = app()->make(InventoryService::class);
        $variants_data     = [];

        foreach ($variants as $variant) {
            $variant_id          = intval($variant['id'] ?? 0);
            $price               = $variant['display_price_money_object']->display;
            $display_price       = $variant['display_price'] ?? 0;
            $display_sale_price  = $variant['display_sale_price'] ?? null;
            $sale_price          = $display_sale_price ? $variant['display_sale_price_money_object']->display : null;
            $discount_percentage = (! empty($display_price) && ! empty($display_sale_price))
                ? round((1 - ($display_sale_price / $display_price)) * 100)
                : null;
            $stock               = intval($variant['available_quantity'] ?? 0);
            $available           = $inventory_service->has_stock($variant_id, 1);
            $allow_back_order    = (bool) ($variant['allow_back_order'] ?? false);
            $has_limit_per_order = (bool) ($variant['has_limit_per_order'] ?? false);
            $max_per_order       = $has_limit_per_order ? intval($variant['max_per_order'] ?? 0) : null;
            $image               = $variant['media']['url'] ?? null;

            $variant_attrs = [];
            foreach ($variant['attribute_values'] ?? [] as $attr_value_id) {
                if (isset($attribute_value_map[$attr_value_id])) {
                    $variant_attrs[] = $attribute_value_map[$attr_value_id];
                }
            }

            $variants_data[] = [
                'id'                  => $variant_id,
                'product_id'          => $product_id,
                'price'               => $price,
                'sale_price'          => $sale_price,
                'discount_percentage' => $discount_percentage,
                'stock'               => $stock,
                'attributes'          => $variant_attrs,
                'available'           => $available,
                'allow_back_order'    => $allow_back_order,
                'has_limit_per_order' => $has_limit_per_order,
                'max_per_order'       => $max_per_order,
                'image'               => $image,
            ];
        }

        $config['product_images']   = $images;
        $config['product_variants'] = $variants_data;

        return $config;
    }
}
