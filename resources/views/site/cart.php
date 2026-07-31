<?php

/**
 * Cart Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\Framework\Route;

use function Kirki\Ecommerce\Framework\view_data;

$cart = view_data('cart');
$pricing = $cart['pricing'];
$currency = $cart['currency'];
$sub_total = Money::format_from_decimal($pricing['subtotal'], $currency['code']);
$total = Money::format_from_decimal($pricing['total'], $currency['code']);
$items = $cart['items'] ?? [];

?>
<?php Template::get_header(); ?>

<div class="kecom-cart-page">
    <div class="kecom-cart-grid">
        <div class="kecom-cart-items">
            <div class="kecom-cart-items-header">
                <div class="kecom-cart-items-header-title">
                    <h4 class="kecom-cart-items-header-title-heading"><?php _e('Your Cart', 'kirki-ecommerce'); ?></h4>
                    <span class="kecom-cart-items-header-title-count"><?php printf(__('(%d)', 'kirki-ecommerce'), (int) view_data('cart.items_count')); ?></span>
                </div>
                <div class="kecom-cart-items-header-actions">
                    <a href="<?php echo esc_url(Route::site_url('shop')); ?>" class="kecom-cart-items-header-actions-link">Continue Shopping</a>
                </div>
            </div>
            <?php if (count($items)): ?>
                <?php foreach ($items as $item):
                    $product = $item['product'] ?? [];
                    $media = $product['media'] ?? [];
                    $categories = $product['categories'] ?? [];
                    $price = Money::format_from_decimal($product['price'], $currency['code']);

                ?>
                    <div class="kecom-cart-item" x-data="quantitySelector({ min:1, max: 99, initial: 1})">
                        <div class="kecom-cart-item-image">
                            <?php if (!empty($media) && isset($media['url'])): ?>
                                <img src="<?php echo esc_url($media['url']); ?>" alt="<?php echo esc_attr($product['title']); ?>">
                            <?php else: ?>
                                <img src="<?php echo esc_url('https://placehold.co/600x400'); ?>" alt="<?php echo esc_attr($product['title']); ?>">
                            <?php endif; ?>
                        </div>
                        <div class="kecom-cart-item-details">
                            <h6 class="kecom-cart-item-details-title"><?php echo esc_html($product['title']); ?></h6>
                            <?php if (!empty($categories)): ?>
                                <span class="kecom-cart-item-details-categories"><?php echo esc_html($categories[count($categories) - 1]['name']); ?></span>
                            <?php endif; ?>
                            <div class="kecom-quantity">
                                <button class="kecom-quantity-btn" type="button" aria-label="Remove item" @click="remove" x-show="quantity === 1"> <?php Icon::render('trash'); ?></button>
                                <button class="kecom-quantity-btn" type="button" aria-label="Decrease" @click="decrement" x-show="quantity > 1">-</button>
                                <input class="kecom-quantity-input" type="number" :value="quantity" @input="setValue($el.value)" min="1" max="99" aria-label="Quantity">
                                <button class="kecom-quantity-btn" type="button" aria-label="Increase" @click="increment">+</button>
                            </div>
                        </div>
                        <div class="kecom-cart-item-pricing">
                            <h6 class="kecom-cart-item-pricing-total"><?php echo esc_html($price); ?></h6>
                            <span class="kecom-cart-item-pricing-each"><?php printf(__('%s each', 'kirki-ecommerce'), $price) ?></span>
                            <button class="kecom-btn kecom-btn-outline kecom-cart-item-remove" type="button" aria-label="Remove item" @click="remove" x-show="quantity > 1">
                                <?php Icon::render('trash'); ?>
                            </button>
                        </div>
                    </div>
                    <div class="kecom-divider"></div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        <div class="kecom-cart-summary">
            <h4 class="kecom-cart-summary-title"><?php _e('Cart Totals', 'kirki-ecommerce'); ?></h4>
            <div class="kecom-cart-summary-item">
                <span class="kecom-cart-summary-item-title"><?php _e('Subtotal', 'kirki-ecommerce'); ?></span>
                <span class="kecom-cart-summary-item-value"><?php echo esc_html($sub_total); ?></span>
            </div>
            <div class="kecom-cart-summary-item">
                <span class="kecom-cart-summary-item-title"><?php _e('Estimate shipping', 'kirki-ecommerce'); ?></span>
                <span class="kecom-cart-summary-item-value"><?php echo '-' ?></span>
            </div>
            <div class="kecom-cart-summary-item">
                <span class="kecom-cart-summary-item-title"><?php _e('Estimate taxes', 'kirki-ecommerce'); ?></span>
                <span class="kecom-cart-summary-item-value"><?php echo '-' ?></span>
            </div>
            <div class="kecom-divider"></div>
            <div class="kecom-cart-summary-total">
                <span class="kecom-cart-summary-total-title"><?php _e('Estimate Total', 'kirki-ecommerce'); ?></span>
                <span class="kecom-cart-summary-total-value"><?php echo esc_html($total); ?></span>
            </div>
            <button type="button" class="kecom-btn kecom-btn-primary kecom-btn-block kecom-cart-summary-checkout-btn">
                <?php Icon::render('lock'); ?>
                <?php _e('Proceed to Checkout', 'kirki-ecommerce'); ?>
            </button>
        </div>
    </div>
</div>
<?php Template::get_footer();
?>