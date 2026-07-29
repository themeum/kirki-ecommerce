<?php

/**
 * Product Card Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 *
 * @var array $data comes from shop.php file.
 */

defined('ABSPATH') || exit;
if (!isset($data['product']) || !is_object($data['product'])) {
    return;
}

$product = $data['product'];
$variants = $product->variants()->get();
$price = $variants->first()->price;
?>

<div class="kirki-ecom-product-card">
    <h3><a href="<?php echo esc_url($product->get_url()) ?>"><?php echo esc_html($product->title); ?></a></h3>
    <div><?php esc_html_e('Price:', 'kirki-ecommerce'); ?> <?php echo esc_html($price); ?></div>
    <button type="button"><?php echo esc_html__('Add to Cart', 'kirki-ecommerce'); ?></button>
</div>
