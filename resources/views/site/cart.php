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
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Route;

use function Kirki\Ecommerce\Framework\view_data;

$cart = view_data('cart');
$pricing = $cart['pricing'];
$currency = $cart['currency'];
$items = $cart['items'] ?? [];
$cart_config = array(
    'items_count' => $cart['items_count'],
    'sub_total' => Money::format_from_decimal($pricing['subtotal'], $currency['code']),
    'total' => Money::format_from_decimal($pricing['total'], $currency['code']),
    'formatted_items' => (object) array_reduce(
        $items,
        function ($carry, $item) use ($currency) {
            $carry[$item['id']] = Money::format_from_decimal($item['total'], $currency['code']);
            return $carry;
        },
        [],
    ),
);

?>
<?php Template::get_header(); ?>

<div class="kecom-cart-page" x-data='cart(<?php echo json_encode($cart_config); ?>)'>
    <div class="kecom-cart-grid">
        <div class="kecom-cart-items">
            <div class="kecom-cart-items-header">
                <div class="kecom-cart-items-header-title">
                    <h4 class="kecom-cart-items-header-title-heading"><?php _e('Your Cart', 'kirki-ecommerce'); ?></h4>
                    <span class="kecom-cart-items-header-title-count" x-text="`(${cart_value.items_count})`"></span>
                </div>
                <div class="kecom-cart-items-header-actions">
                    <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-cart-items-header-actions-link">Continue Shopping</a>
                </div>
            </div>
            <?php if (count($items)): ?>
                <?php foreach ($items as $item):
                    $product = $item['product'] ?? [];
                    $media = $product['media'] ?? [];
                    $categories = $product['categories'] ?? [];
                    $attributes = $product['attributes'] ?? [];
                    $quantity = (int) $item['quantity'] ?? 1;
                    $max_quantity = (int) $product['available_quantity'] ?? 1;
                    $price = Money::format_from_decimal($item['total'], $currency['code']);
                    $unit_price = Money::format_from_decimal($product['sale_price'] ?? $product['price'], $currency['code']);

                ?>
                    <div class="kecom-cart-item" id="<?php echo esc_html($item['id']); ?>" x-data="<?php printf('quantitySelector({ min:1, max:%d, initial:%d, onChange: (q) => update(%d,q) })', $max_quantity, $quantity, $item['id']); ?>">
                        <div class="kecom-cart-item-image">
                            <?php if (!empty($media) && isset($media['url'])): ?>
                                <img src="<?php echo esc_url($media['url']); ?>" alt="<?php echo esc_attr($product['title']); ?>">
                            <?php else: ?>
                                <img src="<?php echo esc_url(Assets::get_url('images/product-fallback.png')); ?>" alt="<?php echo esc_attr($product['title']); ?>">
                            <?php endif; ?>
                        </div>
                        <div class="kecom-cart-item-description">
                            <div class="kecom-cart-item-info">
                                <div class="kecom-cart-item-details">
                                    <h6 class="kecom-cart-item-details-title"><?php echo esc_html($product['title']); ?></h6>
                                    <?php if (!empty($categories)): ?>
                                        <span class="kecom-cart-item-details-categories"><?php echo esc_html($categories[count($categories) - 1]['name']); ?></span>
                                    <?php endif; ?>

                                    <?php if (!empty($attributes)): ?>
                                        <span class="kecom-cart-item-details-attributes"><?php echo esc_html(implode(" • ", $attributes)); ?></span>
                                    <?php endif; ?>

                                </div>
                                <div class="kecom-cart-item-pricing">
                                    <h6 class="kecom-cart-item-pricing-total" x-text="<?php printf("cart_value.formatted_items['%d']", $item['id']); ?>"></h6>
                                    <span class="kecom-cart-item-pricing-each"><?php printf(__('%s each', 'kirki-ecommerce'), $unit_price) ?></span>
                                </div>
                            </div>
                            <div class="kecom-cart-item-quantity">
                                <div class="kecom-quantity">
                                    <button class="kecom-quantity-btn" type="button" aria-label="Remove item" @click="remove(<?php echo esc_html($item['id']); ?>)" x-show="quantity === 1"> <?php Icon::render('trash'); ?></button>
                                    <button class="kecom-quantity-btn" type="button" aria-label="Decrease" @click.debounce.100ms="decrement" x-show="quantity > 1"><?php Icon::render('minus'); ?></button>
                                    <input class="kecom-quantity-input" type="number" :value="quantity" @input.debounce.500ms="setValue($el.value)" min="1" max="<?php echo esc_html($max_quantity); ?>" :disabled="quantity >= max" aria-label="Quantity">
                                    <button class="kecom-quantity-btn" type="button" aria-label="Increase" @click.debounce.100ms="increment" :disabled="quantity >= max"> <?php Icon::render('plus'); ?></button>
                                </div>
                                <button class="kecom-btn kecom-btn-outline kecom-cart-item-remove" type="button" aria-label="Remove item" x-show="quantity > 1" @click="remove(<?php echo esc_html($item['id']); ?>)" :disabled="loading">
                                    <?php Icon::render('trash'); ?>
                                </button>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        <div class="kecom-cart-summary">
            <h4 class="kecom-cart-summary-title"><?php _e('Cart Totals', 'kirki-ecommerce'); ?></h4>
            <div class="kecom-cart-summary-item">
                <span class="kecom-cart-summary-item-title"><?php _e('Subtotal', 'kirki-ecommerce'); ?></span>
                <span class="kecom-cart-summary-item-value" x-text="cart_value.sub_total"></span>
            </div>
            <div class="kecom-cart-summary-item">
                <span class="kecom-cart-summary-item-title"><?php _e('Estimate shipping', 'kirki-ecommerce'); ?></span>
                <span class="kecom-cart-summary-item-value"><?php echo '-' ?></span>
            </div>
            <div class="kecom-cart-summary-item">
                <span class="kecom-cart-summary-item-title"><?php _e('Estimate taxes', 'kirki-ecommerce'); ?></span>
                <span class="kecom-cart-summary-item-value"><?php echo '-' ?></span>
            </div>
            <div class="kecom-cart-summary-total">
                <span class="kecom-cart-summary-total-title"><?php _e('Estimate Total', 'kirki-ecommerce'); ?></span>
                <span class="kecom-cart-summary-total-value" x-text="cart_value.total"></span>
            </div>
            <a href="<?php echo esc_url(Url::get_checkout_url()); ?>" class="kecom-btn kecom-btn-primary kecom-btn-block kecom-cart-summary-checkout-btn">
                <?php _e('Proceed to Checkout', 'kirki-ecommerce'); ?>
            </a>
        </div>
    </div>
</div>
<?php Template::get_footer();
?>