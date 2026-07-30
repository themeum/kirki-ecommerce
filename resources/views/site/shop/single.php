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
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Icon;

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
$price = Money::format_from_decimal($variant['price'], $currency['code']);
$sale_price = isset($variant['sale_price']) ? Money::format_from_decimal($variant['sale_price'], $currency['code']) : null;
$quantity = (int) $variant['available_quantity'] ?? 0;
$additional_info = $product['additional_info'] ?? [];

// Prepare images for Alpine.js
$images = [];
if (!empty($product_image) && isset($product_image['url'])) {
    $images[] = ['id' => $product_image['id'] ?? 0, 'url' => $product_image['url']];
}
foreach ($media as $media_item) {
    $images[] = ['id' => $media_item['id'] ?? 0, 'url' => $media_item['url']];
}

// Prepare variants for Alpine.js
$variants_data = [];

// Build a lookup map for attribute values: [attribute_value_id] => ['name' => attribute_name, 'value' => attribute_value]
$attribute_value_map = [];
foreach ($attributes as $attribute) {
    $attr_name = $attribute['name'] ?? '';
    foreach ($attribute['values'] ?? [] as $value) {
        $attr_value_id = $value['id'] ?? 0;
        $attribute_value_map[$attr_value_id] = [
            'name' => $attr_name,
            'value' => $value['value'] ?? '',
            'color' => $value['color'] ?? null
        ];
    }
}

foreach ($variants as $v) {
    $variant_attrs = [];
    
    // Map attribute value IDs to actual attribute name/value pairs
    if (!empty($v['attribute_values'])) {
        foreach ($v['attribute_values'] as $attr_value_id) {
            if (isset($attribute_value_map[$attr_value_id])) {
                $variant_attrs[] = [
                    'name' => $attribute_value_map[$attr_value_id]['name'],
                    'value' => $attribute_value_map[$attr_value_id]['value'],
                    'color' => $attribute_value_map[$attr_value_id]['color']
                ];
            }
        }
    }
    
    $variants_data[] = [
        'id' => $v['id'] ?? 0,
        'product_id' => $product['id'] ?? 0,
        'price' => is_object($v['price']) && method_exists($v['price'], 'toFloat') ? (float) $v['price']->toFloat() : (float) ($v['price'] ?? 0),
        'compare_price' => isset($v['sale_price']) ? (is_object($v['sale_price']) && method_exists($v['sale_price'], 'toFloat') ? (float) $v['sale_price']->toFloat() : (float) $v['sale_price']) : null,
        'stock' => (int) ($v['available_quantity'] ?? 0),
        'attributes' => $variant_attrs,
        'available' => ($v['available_quantity'] ?? 0) > 0,
        'image' => isset($v['media']['url']) ? $v['media']['url'] : null
    ];
}

// Set localized data for JavaScript
Template::set_localized_data('productImages', $images);
Template::set_localized_data('productVariants', $variants_data);

?>

<?php Template::get_header();
?>

<div class="kecom-product-page">
    <div class="kecom-container">
        <div class="kecom-product-grid">
            <!-- Left: Product Images -->
            <div class="kecom-product-gallery" x-data="imageSlider({ images: kecomSiteData.productImages || [] })">
                <div class="kecom-product-main-image">
                    <img :src="currentImage.url" alt="<?php echo esc_attr($product['title']); ?>">
                    <?php if (count($images) > 1): ?>
                        <button class="kecom-product-nav-btn kecom-product-nav-prev" @click="prev" aria-label="Previous image">
                            <?php Icon::render('arrow-left', array('size' => 20)); ?>
                        </button>
                        <button class="kecom-product-nav-btn kecom-product-nav-next" @click="next" aria-label="Next image">
                            <?php Icon::render('arrow-right', array('size' => 20)); ?>
                        </button>
                    <?php endif; ?>
                </div>
                <?php if (count($images) > 1): ?>
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
            <div class="kecom-product-info" x-data="variantSelector({ variants: kecomSiteData.productVariants || [] })" x-init="init()">
                <div class="kecom-product-title-and-price">
                    <?php if (! empty($ribbon)): ?>
                        <span class="kecom-product-ribbon"><?php echo esc_html($ribbon); ?></span>
                    <?php endif; ?>

                    <h1 class="kecom-product-title"><?php echo esc_html($product['title']); ?></h1>
                    
                    <div class="kecom-product-price">
                        <span class="kecom-product-price-current" x-text="'<?php echo esc_html($currency['symbol'] ?? ''); ?>' + Number(selectedVariant?.price ?? <?php echo esc_js($variant['price'] ?? 0); ?>).toFixed(2)"></span>
                        <span class="kecom-product-price-original" x-show="selectedVariant?.compare_price" x-text="'<?php echo esc_html($currency['symbol'] ?? ''); ?>' + Number(selectedVariant?.compare_price ?? 0).toFixed(2)"></span>
                        <span class="kecom-product-discount" x-show="selectedVariant?.compare_price" x-text="'Save ' + Math.round((1 - Number(selectedVariant?.price ?? <?php echo esc_js($variant['price'] ?? 0); ?>) / Number(selectedVariant?.compare_price ?? 1)) * 100) + '%'"></span>
                    </div>
                </div>

                <?php if (! empty($product['description'])): ?>
                    <p class="kecom-product-short-description">
                        <?php echo esc_html($product['description']); ?>
                    </p>
                <?php endif; ?>

                <!-- Variant Selection -->
                <?php if (! empty($attributes)): ?>
                    <?php foreach ($attributes as $attribute):
                        $attr_name = $attribute['name'] ?? '';
                        $attr_values = $attribute['values'] ?? [];
                        $is_color = strtolower($attr_name) === 'color';
                    ?>
                        <div class="kecom-product-variant-group">
                            <span class="kecom-product-variant-label"><?php echo esc_html($attr_name); ?>: <span x-text="selectedAttributes['<?php echo esc_js($attr_name); ?>']"></span></span>
                            <div class="kecom-product-variant-options">
                                <?php foreach ($attr_values as $item): ?>
                                    <?php if ($is_color): ?>
                                        <div 
                                            class="kecom-product-variant-color" 
                                            :class="{ 'selected': isAttributeSelected('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>'), 'opacity-50': !isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>') }"
                                            :style="{ 'background-color': '<?php echo esc_js($item['color'] ?? $item['value']); ?>' }"
                                            @click="isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>') && selectAttribute('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>')"
                                        ></div>
                                    <?php else: ?>
                                        <div 
                                            class="kecom-product-variant-option" 
                                            :class="{ 'selected': isAttributeSelected('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>'), 'opacity-50': !isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>') }"
                                            @click="isAttributeAvailable('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>') && selectAttribute('<?php echo esc_js($attr_name); ?>', '<?php echo esc_js($item['value']); ?>')"
                                            x-text="'<?php echo esc_js($item['value']); ?>'"
                                        ></div>
                                    <?php endif; ?>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>

                <!-- Quantity -->
                <div class="kecom-product-variant-group">
                    <span class="kecom-product-variant-label">Quantity</span>
                    <div x-data="quantitySelector({ min: 1, max: selectedVariant?.stock || <?php echo esc_js($quantity); ?>, initial: 1 })" class="kecom-quantity">
                        <button class="kecom-quantity-btn" type="button" aria-label="Decrease" @click="decrement">
                            <?php Icon::render('minus'); ?>
                        </button>
                        <input class="kecom-quantity-input" type="number" :value="quantity" @input="setValue($el.value)" min="1" :max="selectedVariant?.stock || <?php echo esc_js($quantity); ?>" aria-label="Quantity">
                        <button class="kecom-quantity-btn" type="button" aria-label="Increase" @click="increment">
                            <?php Icon::render('plus'); ?>
                        </button>
                    </div>
                </div>

                <!-- Add to Cart Button -->
                <button class="kecom-btn kecom-btn-primary kecom-btn-block kecom-btn-lg" x-data="addToCart({ variantId: selectedVariantId, qty: 1 })" @click="add" :disabled="!selectedVariant?.available || loading" :class="{ 'kecom-btn-loading': loading }">
                    <?php Icon::render('cart'); ?>
                    <span x-show="!loading" x-text="selectedVariant?.available ? 'Add to Cart' : 'Out of Stock'"></span>
                </button>
            </div>
        </div>
    </div>

    <!-- Bottom: Tabs -->
    <div class="kecom-product-information">
        <div class="kecom-container">
            <div class="kecom-product-tabs" x-data="tabs({ activeTab: 'description' })">
                <div class="kecom-product-tab-header">
                    <button class="kecom-product-tab-btn" :class="{ 'active': activeTab === 'description' }" @click="activeTab = 'description'">Description</button>
                    <?php if (count($additional_info) > 0): ?>
                        <?php foreach ($additional_info as $index => $info): ?>
                            <button class="kecom-product-tab-btn" :class="{ 'active': activeTab === 'info-<?php echo esc_attr($index); ?>' }" @click="activeTab = 'info-<?php echo esc_attr($index); ?>'"><?php echo esc_html($info['title']); ?></button>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
                
                <div class="kecom-product-tab-content" :class="{ 'active': activeTab === 'description' }">
                    <h3>Product Description</h3>
                    <p><?php echo esc_html($product['description'] ?? ''); ?></p>
                </div>

                <?php foreach ($additional_info as $index => $info): ?>
                    <div class="kecom-product-tab-content" :class="{ 'active': activeTab === 'info-<?php echo esc_attr($index); ?>' }">
                        <h3><?php echo esc_html($info['title']); ?></h3>
                        <p><?php echo esc_html($info['description']); ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>