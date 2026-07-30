<?php

/**
 * Shop Single Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Helpers\TemplateHelper;
use Kirki\Ecommerce\App\Wordpress\SiteRoute;

$product = SiteRoute::route_data('product', []);

$media = $product['media'] ?? [];
$product_image = array_shift($media) ?? [];
$has_variants = $product['has_variants'] ?? false;
$ribbon = $product['ribbon'] ?? '';

$variants = $product['variants'] ?? [];
$attributes = $product['attributes'] ?? [];
$currency = $product['currency'] ?? [];
$variant = $variants[0] ?? [];
$price = Money::format_from_decimal($variant['price'], $currency['code']);
$sale_price = isset($variant['sale_price']) ? Money::format_from_decimal($variant['sale_price'], $currency['code']) : null;
$quantity = (int) $variant['available_quantity'] ?? 0;
$additional_info = $product['additional_info'] ?? [];

TemplateHelper::get_header();
?>

<div class="kirki-ecom-page-wrapper">
    <div class="kecom-product-wrapper">
        <div class="kecom-product-image">
            <div class="kecom-product-image-main">
                <?php if (! empty($product_image) && isset($product_image['url'])): ?>
                    <img src="<?php echo esc_url($product_image['url']); ?>" alt="<?php echo esc_attr($product['title']); ?>">
                <?php else: ?>
                    <img src="<?php echo esc_url('https://placehold.co/600x400'); ?>" alt="<?php echo esc_attr($product['title']); ?>">
                <?php endif; ?>
            </div>
            <?php if (count($media)): ?>
                <div class="kecom-product-image-slider">
                    <?php foreach ($media as $media_item): ?>
                        <div class="kecom-product-image-thumbnail">
                            <img src="<?php echo esc_url($media_item['url']); ?>" alt="<?php echo esc_attr($product['title']); ?>">
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
        <div class="kecom-product-info">
            <?php if (! empty($ribbon)): ?>
                <div class="kecom-product-ribbon"><span class="kecom-product-ribbon-item"><?php echo esc_html($ribbon); ?></span></div>
            <?php endif; ?>
            <h2 class="kecom-product-title"><?php echo esc_html($product['title']); ?></h1>
                <?php if ($sale_price): ?>
                    <p class="kecom-product-price">
                        <span><?php echo esc_html($sale_price); ?></span>
                        <del><?php echo esc_html($price); ?></del>
                    </p>
                <?php else: ?>
                    <p class="kecom-product-price"><?php echo esc_html($price); ?></p>
                <?php endif; ?>
                <hr />
                <?php if (! empty($product['description'])): ?>
                    <?php //@TODO: need a new column called 'short_description' 
                    ?>
                    <div class="kecom-product-description"><?php echo esc_html($product['description']); ?></div>
                <?php endif; ?>
                <form id="kirki-single-product-form" method="get" style="display: flex; flex-direction: column; gap: 16px; align-items: stretch; width:100%;">
                    <?php if (! empty($attributes)): ?>
                        <?php foreach ($attributes as $attribute):
                            $title = $attribute['name'] ?? '';
                            $items = $attribute['values'] ?? [];
                        ?>
                            <div class="kecom-product-attribute">
                                <b class="kecom-product-attribute-title"><?php echo esc_html($title); ?></b>
                                <div class="kecom-product-attribute-values">
                                    <?php foreach ($items as $item): ?>
                                        <input type="radio" id="<?php echo esc_attr($item["id"]); ?>" name="<?php echo esc_attr(strtolower($title)); ?>" value="<?php echo esc_attr($item["value"]); ?>">
                                        <label for="<?php echo esc_attr($item["id"]); ?>"><?php echo esc_html($item["value"]); ?></label>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                    <?php if ($quantity > 0): ?>
                        <div class="kecom-product-quantity-wrapper">
                            <label class="kecom-product-stock" for="quantity"><?php echo esc_html__('Quantity:', 'kirki-ecommerce'); ?></label>
                            <input class="kecom-product-quantity" type="number" id="quantity" name="quantity" value="1" min="1" max="<?php echo esc_attr($quantity); ?>">
                            <span class="kecom-product-stock-label"><?php printf(_n('%d pcs left', '%d pcs left', $quantity, 'kirki-ecommerce'), $quantity); ?></span>
                        </div>
                    <?php endif; ?>
                    <button class="kecom-add-to-cart" type="button"><?php echo esc_html__('Add to Cart', 'kirki-ecommerce'); ?></button>
                </form>
        </div>
    </div>
    <div class="kecom-product-additional-info-wrapper">
        <div>
            <h4><b><?php echo esc_html__("Description", 'kirki-ecommerce'); ?></b></h4>
            <hr>
            <p><?php echo esc_html($product['description'] ?? ''); ?></p>
        </div>
        <?php if (count($additional_info)): ?>
            <?php foreach ($additional_info as $info): ?>
                <div>
                    <h4><b><?php echo esc_html($info['title']); ?></b></h4>
                    <hr>
                    <p><?php echo esc_html($info['description']); ?></p>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>

    </div>
</div>
<?php TemplateHelper::get_footer(); ?>