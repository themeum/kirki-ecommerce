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
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$product = view_data();

$media = $product['media'] ?? [];
$product_image = array_shift($media) ?? [];
$has_variants = $product['has_variants'] ?? false;
$ribbon = $product['ribbon'] ?? '';

$variants = $product['variants'] ?? [];
$attributes = $product['attributes'] ?? [];
$currency = $product['currency'] ?? [];
$variant = $variants[0] ?? [];
$price = Money::format_from_decimal($variant['base_price'], $currency['code']);
$sale_price = isset($variant['base_sale_price']) ? Money::format_from_decimal($variant['base_sale_price'], $currency['code']) : null;
$track_inventory = $variant['track_inventory'] ?? false;
$quantity = (int) $variant['available_quantity'] ?? 0;
$additional_info = $product['additional_info'] ?? [];

// Get variant ID from URL query param
$selected_variant_id = isset($_GET['variant_id']) ? (int) $_GET['variant_id'] : null;

// Prepare images for Alpine.js
$images = [];
if (!empty($product_image) && isset($product_image['url'])) {
    $images[] = ['id' => $product_image['id'] ?? 0, 'url' => $product_image['url']];
}
foreach ($media as $media_item) {
    $images[] = ['id' => $media_item['id'] ?? 0, 'url' => $media_item['url']];
}

?>

<?php Template::get_header();
?>

<div class="kecom-page-wrapper kecom-product-page">
    <div class="kecom-container">
        <?php
        include_view(
            'site.shop.parts.breadcrumb',
            [
                'items' => [
                    ['label' => __('Home', 'kirki-ecommerce'), 'url' => home_url('/')],
                    ['label' => __('Shop', 'kirki-ecommerce'), 'url' => Url::get_shop_url()],
                ],
                'current' => $product['title'],
            ]
        );
        ?>
    </div>
    <div class="kecom-container">
        <div class="kecom-product-grid">
            <!-- Left: Product Images -->
            <div class="kecom-product-gallery" x-data="imageSlider({ images: kirki_ecommerce.product_images || [] })">
                <div class="kecom-product-main-image">
                    <template x-if="currentImage.url">
                        <img :src="currentImage.url" alt="<?php echo esc_attr($product['title']); ?>">
                    </template>
                    <template x-if="!currentImage.url">
                        <img src="<?php echo esc_url(Assets::get_url('images/product-fallback.webp')); ?>" alt="<?php echo esc_attr($product['title']); ?>">
                    </template>
                    <?php if (count($images) > 1) : ?>
                        <button class="kecom-product-nav-btn kecom-product-nav-prev" @click="prev" aria-label="Previous image">
                            <?php Icon::render('arrow-left', array('size' => 20)); ?>
                        </button>
                        <button class="kecom-product-nav-btn kecom-product-nav-next" @click="next" aria-label="Next image">
                            <?php Icon::render('arrow-right', array('size' => 20)); ?>
                        </button>
                    <?php endif; ?>
                </div>
                <?php if (count($images) > 1) : ?>
                    <div class="kecom-product-thumbnails">
                        <template x-for="(image, index) in images" :key="image.id">
                            <div class="kecom-product-thumbnail" :class="{ 'active': currentIndex === index }" @click="goTo(index)">
                                <img :src="image.url" :alt="'Thumbnail ' + (index + 1)">
                            </div>
                        </template>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Right: Product Info -->
            <div class="kecom-product-info" x-data="variantSelector({ variants: kirki_ecommerce.product_variants || []<?php if ($selected_variant_id) :
                ?>, selectedVariantId: <?php echo (int) $selected_variant_id; ?><?php
                                                                                                                      endif; ?> })">
                <div class="kecom-product-title-and-price">
                    <?php if (! empty($ribbon)) : ?>
                        <span class="kecom-product-ribbon"><?php echo esc_html($ribbon); ?></span>
                    <?php endif; ?>

                    <h1 class="kecom-product-title"><?php echo esc_html($product['title']); ?></h1>
                    
                    <div class="kecom-product-price">
                        <span class="kecom-product-price-current" x-text="selectedVariant?.sale_price ? selectedVariant?.sale_price : selectedVariant?.price"></span>
                        <span class="kecom-product-price-original" x-show="selectedVariant?.sale_price && selectedVariant?.sale_price !== selectedVariant?.price" x-text="selectedVariant?.price"></span>
                        <span class="kecom-product-discount" x-show="selectedVariant?.discount_percentage" x-text="'Save ' + selectedVariant?.discount_percentage + '%'"></span>
                    </div>
                </div>

                <?php if (! empty($product['description'])) : ?>
                    <p class="kecom-product-short-description">
                        <?php echo esc_html($product['short_description']); ?>
                    </p>
                <?php endif; ?>

                <!-- Variant Selection -->
                <?php if (! empty($attributes)) : ?>
                    <?php foreach ($attributes as $attribute) :
                        $attr_name = $attribute['name'] ?? '';
                        $attr_values = $attribute['values'] ?? [];
                        $is_color = strtolower($attr_name) === 'color';
                        ?>
                        <div class="kecom-product-variant-group">
                            <span class="kecom-product-variant-label"><?php echo esc_html($attr_name); ?>: <span x-text="selectedAttributes['<?php echo esc_js($attr_name); ?>']"></span></span>
                            <div class="kecom-product-variant-options">
                                <?php foreach ($attr_values as $item) : ?>
                                    <?php if ($is_color) : ?>
                                        <button 
                                            type="button"
                                            class="kecom-product-variant-color"
                                            :class="{ 'selected': isAttributeSelected('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>') }"
                                            :style="{ 'background-color': '<?php echo esc_js($item['color'] ?? $item['value']); ?>' }"
                                            :disabled="!isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>')"
                                            :aria-disabled="!isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>')"
                                            :aria-pressed="isAttributeSelected('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>')"
                                            :aria-label="'<?php echo esc_js($attr_name . ': ' . $item['value']); ?>' + (!isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>') ? ' (unavailable)' : '')"
                                            :title="!isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>') ? 'Out of stock' : null"
                                            @click="selectAttribute('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>')"
                                        ></button>
                                    <?php else : ?>
                                        <button 
                                            type="button"
                                            class="kecom-product-variant-option"
                                            :class="{ 'selected': isAttributeSelected('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>') }"
                                            :disabled="!isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>')"
                                            :aria-disabled="!isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>')"
                                            :aria-pressed="isAttributeSelected('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>')"
                                            :aria-label="'<?php echo esc_js($attr_name . ': ' . $item['value']); ?>' + (!isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>') ? ' (unavailable)' : '')"
                                            :title="!isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>') ? 'Out of stock' : null"
                                            @click="selectAttribute('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>')"
                                            x-text="'<?php echo esc_js($item['value']); ?>'"
                                        ></button>
                                    <?php endif; ?>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>

                <!-- Quantity -->
                 <div class="kecom-product-variant-group">
                    <span class="kecom-product-variant-label"><?php esc_html_e('Quantity', 'kirki-ecommerce'); ?></span>
                    <div
                        x-data="quantitySelector({
                            min: 1,
                            max: () => {
                                const variant = selectedVariant;
                                if (!variant) return undefined;
                                const limits = [];
                                <?php if ($track_inventory) : ?>
                                if (variant.stock !== undefined && !variant.allow_back_order) limits.push(variant.stock);
                                <?php endif; ?>
                                if (variant.has_limit_per_order && variant.max_per_order) limits.push(variant.max_per_order);
                                return limits.length ? Math.min(...limits) : undefined;
                            },
                            initial: 1
                        })"
                        class="kecom-quantity"
                        id="product-quantity"
                    >
                        <button
                            class="kecom-quantity-btn"
                            type="button"
                            aria-label="Decrease"
                            :disabled="!selectedVariant?.available || isMin"
                            @click="decrement"
                        >
                            <?php Icon::render('minus'); ?>
                        </button>

                        <input
                            class="kecom-quantity-input"
                            type="number"
                            :value="quantity"
                            @change="handleBlur($el)"
                            min="1"
                            :max="max"
                            :disabled="!selectedVariant?.available"
                            aria-label="Quantity"
                            id="quantity-input"
                        >

                        <button
                            class="kecom-quantity-btn"
                            type="button"
                            aria-label="Increase"
                            :disabled="!selectedVariant?.available || isMax"
                            @click="increment"
                        >
                            <?php Icon::render('plus'); ?>
                        </button>
                    </div>
                </div>

                <!-- Add to Cart Button -->
                <div x-data="addToCart({ variantId: selectedVariantId, cartUrl: '<?php echo esc_url(Url::get_cart_url()); ?>', watchVariantId: () => selectedVariantId })">
                    <template x-if="!success">
                        <button class="kecom-btn kecom-btn-primary kecom-btn-block kecom-btn-lg" @click="add(document.getElementById('quantity-input')?.value || 1)" :disabled="!selectedVariant?.available || loading" :class="{ 'kecom-btn-loading': loading }">
                            <?php Icon::render('cart'); ?>
                            <span x-text="selectedVariant?.available ? buttonText : 'Out of Stock'"></span>
                        </button>
                    </template>
                    <template x-if="success">
                        <a :href="cartUrl" class="kecom-btn kecom-btn-primary kecom-btn-block kecom-btn-lg">
                            <?php Icon::render('cart'); ?>
                            <span x-text="buttonText"></span>
                        </a>
                    </template>
                </div>
            </div>
        </div>
    </div>

    <!-- Bottom: Tabs -->
    <div class="kecom-product-information">
        <div class="kecom-container">
            <div class="kecom-product-tabs" x-data="tabs({ activeTab: 'description' })">
                <div class="kecom-product-tab-header">
                    <button class="kecom-product-tab-btn" :class="{ 'active': activeTab === 'description' }" @click="activeTab = 'description'">Description</button>
                    <?php if (count($additional_info) > 0) : ?>
                        <?php foreach ($additional_info as $index => $info) : ?>
                            <button class="kecom-product-tab-btn" :class="{ 'active': activeTab === 'info-<?php echo esc_attr($index); ?>' }" @click="activeTab = 'info-<?php echo esc_attr($index); ?>'"><?php echo esc_html($info['title']); ?></button>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
                
                <div class="kecom-product-tab-content" :class="{ 'active': activeTab === 'description' }">
                    <?php echo wp_kses_post($product['description'] ?? ''); ?>
                </div>

                <?php foreach ($additional_info as $index => $info) : ?>
                    <div class="kecom-product-tab-content" :class="{ 'active': activeTab === 'info-<?php echo esc_attr($index); ?>' }">
                        <?php echo esc_html($info['description']); ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>