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

use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Resources\Product\ProductResource;

if (!isset($data['product']) || !is_object($data['product'])) {
    return;
}

/**
 * @var Product $product.
 */
$product = $data['product'];
$d = ProductResource::make($product);

$variants = $product->variants()->get();
$regular_price = $variants->first()->price;
$sale_price = $variants->first()->sale_price;

$manager = new MoneyManager();
$formatted_regular_price = $manager->format($manager->from_minor($regular_price));
$formatted_sale_price = $manager->format($manager->from_minor($sale_price));

$display_price = '';

if ($sale_price > 0) {
    $display_price = '<ins>' . $formatted_sale_price . '</ins><del>' . $formatted_regular_price . '</del>';
} else {
    $display_price = $formatted_regular_price;
}

$category_name = $product->categories()->first();
$media = $product->media()->first();
$image_url = null;
if ($media) {
    $image_url = wp_get_attachment_image_url($media->ID, 'thumbnail');
}
?>
<div class="kirki-ecom-product-card">
    <div><?php echo esc_html($category_name->name); ?></div>
    <div>
        <?php if ($image_url) : ?>
            <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($product->title); ?>">
        <?php endif; ?>
    </div>
    <h3><a href="<?php echo esc_url($product->get_url()) ?>"><?php echo esc_html($product->title); ?></a></h3>

    <div>
        <?php esc_html_e('Price:', 'kirki-ecommerce'); ?> 
        <?php echo wp_kses($display_price, array('del' => array(), 'ins' => array())); ?>
    </div>
    
    <button type="button"><?php echo esc_html__('Add to Cart', 'kirki-ecommerce'); ?></button>
</div>
