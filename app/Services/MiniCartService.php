<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Resources\Cart\CartResource;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Url;

/**
 * Class MiniCartService
 *
 * @since 1.0.0
 */
class MiniCartService extends CartService
{
    /**
     * Get mini cart html
     *
     * @since 1.0.0
     *
     * @param array $attributes attributes.
     *
     * @return string mini cart html.
     */
    public function get_mimi_cart_html($attributes)
    {
        $attributes = wp_parse_args(
            $attributes,
            [
                'class' => '',
            ]
        );

        $cart = $this->get_current_cart();
        $cart_resource = CartResource::make($cart);
        $total_items_count = $cart_resource['items_count'] ?? 0;

        ob_start();
        ?>
        <a  href="<?php echo esc_url(Url::get_cart_url()); ?>"
            aria-label="<?php esc_attr_e('View Cart', 'kirki-ecommerce'); ?>"
            class="kecom-mini-cart <?php echo esc_attr($attributes['class']); ?>"
            @kecom:cart-updated.document="updateCount($event.detail.items_count)"
            x-data="miniCart({ initialCount: <?php echo (int) $total_items_count; ?> })">

            <span class="kecom-mini-cart-icon" aria-hidden="true"><?php Icon::render('cart', ['size' => 20]); ?></span>
            <span
                class="kecom-mini-cart-count"
                :class="{
                    'is-increasing': direction === 'increase',
                    'is-decreasing': direction === 'decrease'
                }"
                x-text="cartCount"></span>
        </a>
        <?php
        return ob_get_clean();
    }
}
