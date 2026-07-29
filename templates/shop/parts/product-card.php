<?php
/**
 * Product Card Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 *
 * @var array $data Passed from shop.php.
 */

defined('ABSPATH') || exit;

if (!isset($data['product']) || !is_object($data['product'])) {
    return;
}

$product  = $data['product'];
$variants = $product->variants()->get();
$variant  = $variants->first();
$price    = $variant ? $variant->price : null;

$in_stock  = $variant && ($variant->stock_quantity === null || $variant->stock_quantity > 0);
$low_stock = $in_stock && $variant->stock_quantity !== null && $variant->stock_quantity <= 5;

if ($low_stock) {
    $badge_class = 'kirki-badge-warning';
    $badge_label = esc_html__('Low Stock', 'kirki-ecommerce');
} elseif ($in_stock) {
    $badge_class = 'kirki-badge-success-light';
    $badge_label = esc_html__('In Stock', 'kirki-ecommerce');
} else {
    $badge_class = 'kirki-badge-error-light';
    $badge_label = esc_html__('Out of Stock', 'kirki-ecommerce');
}
?>

<div class="kirki-card kirki-card-hoverable">

    <?php if (!empty($product->featured_image)) : ?>
        <img class="kirki-card-image"
             src="<?php echo esc_url($product->featured_image); ?>"
             alt="<?php echo esc_attr($product->title); ?>">
    <?php else : ?>
        <div class="kirki-card-image" style="height:180px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:.75rem;background:#f8f8f9;">
            <?php esc_html_e('No image', 'kirki-ecommerce'); ?>
        </div>
    <?php endif; ?>

    <div class="kirki-card-body">

        <span class="kirki-badge <?php echo esc_attr($badge_class); ?>" style="margin-bottom:.5rem;">
            <?php echo $badge_label; ?>
        </span>

        <h3 class="kirki-card-title">
            <a href="<?php echo esc_url($product->get_url()); ?>" style="color:inherit;text-decoration:none;">
                <?php echo esc_html($product->title); ?>
            </a>
        </h3>

        <?php if (!empty($product->short_description)) : ?>
            <p class="kirki-card-meta"><?php echo esc_html($product->short_description); ?></p>
        <?php endif; ?>

        <?php if ($price !== null) : ?>
            <div class="kirki-card-price"><?php echo esc_html($price); ?></div>
        <?php endif; ?>

    </div>

    <div class="kirki-card-footer">
        <?php if ($in_stock) : ?>
            <button class="kirki-btn kirki-btn-primary kirki-btn-sm kirki-btn-block" type="button">
                <?php esc_html_e('Add to Cart', 'kirki-ecommerce'); ?>
            </button>
        <?php else : ?>
            <button class="kirki-btn kirki-btn-outline kirki-btn-sm kirki-btn-block" type="button" disabled>
                <?php esc_html_e('Out of Stock', 'kirki-ecommerce'); ?>
            </button>
        <?php endif; ?>
    </div>

</div>
