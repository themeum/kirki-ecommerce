<?php

/**
 * Mini Cart Shortcode
 *
 * @package Kirki\Ecommerce\App\Shortcodes
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Shortcodes;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Resources\Cart\CartResource;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Url;
use function Kirki\Ecommerce\Framework\app;

/**
 * Class MiniCartShortcode
 *
 * @since 1.0.0
 *
 * Usage [kecom_mini_cart]
 */
class MiniCartShortcode
{
    /**
     * Name of shortcode
     *
     * @since 1.0.0
     *
     * @var string
     */
    protected $shortcode = 'kecom_mini_cart';

    /**
     * Constructor
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        add_shortcode($this->shortcode, [$this, 'render']);
    }

    /**
     * Render mini cart shortcode
     *
     * @since 1.0.0
     *
     * @param array $attributes Shortcode attributes.
     *
     * @return void
     */
    public function render($attributes)
    {
        $attributes = shortcode_atts(
            [
                'class' => '',
            ],
            $attributes,
            $this->shortcode
        );

        $cart_service = app()->make(CartService::class);
        $cart = $cart_service->get_current_cart();
        $cart_resource = CartResource::make($cart);
        $total_items_count = $cart_resource['items_count'] ?? 0;
        ?>

        <a  href="<?php echo esc_url(Url::get_cart_url()); ?>"
            aria-label="<?php esc_attr_e('View Cart', 'kirki-ecommerce'); ?>"
            class="kecom-mini-cart <?php echo esc_attr($attributes['class']); ?>"
            @kecom:cart-updated.document="updateCount($event.detail.items_count)"
            x-data="{
                cartCount: <?php echo (int) $total_items_count; ?>,
                direction: null,

                updateCount(newCount) {
                    newCount = Number(newCount);

                    if (newCount === this.cartCount) {
                        return;
                    }

                    this.direction = newCount > this.cartCount
                        ? 'increase'
                        : 'decrease';

                    this.cartCount = newCount;

                    setTimeout(() => {
                        this.direction = null;
                    }, 300);
                }
            }">

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
    }
}
