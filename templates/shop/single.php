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

use Kirki\Ecommerce\App\Helpers\TemplateHelper;
use Kirki\Ecommerce\Wordpress\SiteRoute;

$slug = SiteRoute::route_param('slug');
TemplateHelper::get_header();
?>

<div class="kirki-product-page">
    <div class="kirki-product-grid">
        <!-- Left: Product Images -->
        <div class="kirki-product-gallery" x-data="imageSlider({
            images: [
                { id: 1, url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop' },
                { id: 2, url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&auto=format&dpr=2' },
                { id: 3, url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&auto=format&dpr=3' }
            ]
        })">
            <div class="kirki-product-main-image">
                <img :src="currentImage.url" alt="Product Image">
                <button class="kirki-product-nav-btn kirki-product-nav-prev" @click="prev" aria-label="Previous image">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                </button>
                <button class="kirki-product-nav-btn kirki-product-nav-next" @click="next" aria-label="Next image">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </button>
            </div>
            <div class="kirki-product-thumbnails">
                <template x-for="(image, index) in images" :key="image.id">
                    <div class="kirki-product-thumbnail" :class="{ 'active': currentIndex === index }" @click="goTo(index)">
                        <img :src="image.url" :alt="'Thumbnail ' + (index + 1)">
                    </div>
                </template>
            </div>
        </div>

        <!-- Right: Product Info -->
        <div class="kirki-product-info" x-data="variantSelector({
            variants: [
                { id: 1, product_id: 1, price: 149.99, compare_price: 199.99, stock: 10, attributes: [{ name: 'color', value: 'Black' }, { name: 'size', value: 'S' }], available: true },
                { id: 2, product_id: 1, price: 149.99, compare_price: 199.99, stock: 15, attributes: [{ name: 'color', value: 'Black' }, { name: 'size', value: 'M' }], available: true },
                { id: 3, product_id: 1, price: 149.99, compare_price: 199.99, stock: 20, attributes: [{ name: 'color', value: 'Black' }, { name: 'size', value: 'L' }], available: true },
                { id: 4, product_id: 1, price: 149.99, compare_price: 199.99, stock: 5, attributes: [{ name: 'color', value: 'Black' }, { name: 'size', value: 'XL' }], available: true },
                { id: 5, product_id: 1, price: 149.99, compare_price: 199.99, stock: 8, attributes: [{ name: 'color', value: 'White' }, { name: 'size', value: 'S' }], available: true },
                { id: 6, product_id: 1, price: 149.99, compare_price: 199.99, stock: 12, attributes: [{ name: 'color', value: 'White' }, { name: 'size', value: 'M' }], available: true },
                { id: 7, product_id: 1, price: 149.99, compare_price: 199.99, stock: 18, attributes: [{ name: 'color', value: 'White' }, { name: 'size', value: 'L' }], available: true },
                { id: 8, product_id: 1, price: 149.99, compare_price: 199.99, stock: 3, attributes: [{ name: 'color', value: 'White' }, { name: 'size', value: 'XL' }], available: true },
                { id: 9, product_id: 1, price: 159.99, compare_price: 209.99, stock: 7, attributes: [{ name: 'color', value: 'Blue' }, { name: 'size', value: 'S' }], available: true },
                { id: 10, product_id: 1, price: 159.99, compare_price: 209.99, stock: 14, attributes: [{ name: 'color', value: 'Blue' }, { name: 'size', value: 'M' }], available: true },
                { id: 11, product_id: 1, price: 159.99, compare_price: 209.99, stock: 22, attributes: [{ name: 'color', value: 'Blue' }, { name: 'size', value: 'L' }], available: true },
                { id: 12, product_id: 1, price: 159.99, compare_price: 209.99, stock: 6, attributes: [{ name: 'color', value: 'Blue' }, { name: 'size', value: 'XL' }], available: true }
            ]
        })">
            <h1 class="kirki-product-title">Premium Wireless Headphones</h1>
            
            <div class="kirki-product-price">
                <span class="kirki-product-price-current" x-text="'$' + (selectedVariant?.price || 149.99).toFixed(2)"></span>
                <span class="kirki-product-price-original" x-show="selectedVariant?.compare_price" x-text="'$' + (selectedVariant?.compare_price || 199.99).toFixed(2)"></span>
                <span class="kirki-product-discount" x-show="selectedVariant?.compare_price" x-text="'-' + Math.round((1 - selectedVariant.price / selectedVariant.compare_price) * 100) + '%'"></span>
            </div>

            <p class="kirki-product-description">
                Experience crystal-clear audio with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and ultra-comfortable ear cushions for all-day listening.
            </p>

            <!-- Color Variant -->
            <template x-for="(values, attrName) in uniqueAttributes" :key="attrName">
                <div class="kirki-product-variant-group" x-show="attrName === 'color'">
                    <span class="kirki-product-variant-label">Color: <span x-text="selectedAttributes[attrName]"></span></span>
                    <div class="kirki-product-variant-options">
                        <template x-for="value in values" :key="value">
                            <div 
                                class="kirki-product-variant-color" 
                                :class="{ 'selected': isAttributeSelected(attrName, value), 'opacity-50': !isAttributeAvailable(attrName, value) }"
                                :style="{ 'background-color': value === 'Black' ? '#1a1a1a' : value === 'White' ? '#f5f5f5' : '#3b82f6' }"
                                @click="isAttributeAvailable(attrName, value) && selectAttribute(attrName, value)"
                            ></div>
                        </template>
                    </div>
                </div>
            </template>

            <!-- Size Variant -->
            <template x-for="(values, attrName) in uniqueAttributes" :key="attrName">
                <div class="kirki-product-variant-group" x-show="attrName === 'size'">
                    <span class="kirki-product-variant-label">Size: <span x-text="selectedAttributes[attrName]"></span></span>
                    <div class="kirki-product-variant-options">
                        <template x-for="value in values" :key="value">
                            <div 
                                class="kirki-product-variant-option" 
                                :class="{ 'selected': isAttributeSelected(attrName, value), 'opacity-50': !isAttributeAvailable(attrName, value) }"
                                @click="isAttributeAvailable(attrName, value) && selectAttribute(attrName, value)"
                                x-text="value"
                            ></div>
                        </template>
                    </div>
                </div>
            </template>

            <!-- Quantity -->
            <div class="kirki-product-variant-group">
                <span class="kirki-product-variant-label">Quantity</span>
                <div x-data="quantitySelector({ min: 1, max: selectedVariant?.stock || 10, initial: 1 })" class="kirki-quantity">
                    <button class="kirki-quantity-btn" type="button" aria-label="Decrease" @click="decrement">−</button>
                    <input class="kirki-quantity-input" type="number" :value="quantity" @input="setValue($el.value)" min="1" :max="selectedVariant?.stock || 10" aria-label="Quantity">
                    <button class="kirki-quantity-btn" type="button" aria-label="Increase" @click="increment">+</button>
                </div>
            </div>

            <!-- Add to Cart Button -->
            <button class="kirki-btn kirki-btn-primary kirki-btn-block kirki-btn-lg" x-data="addToCart({ variantId: selectedVariantId, qty: 1 })" @click="add" :disabled="!selectedVariant?.available || loading" :class="{ 'kirki-btn-loading': loading }">
                <span x-show="!loading" x-text="selectedVariant?.available ? 'Add to Cart' : 'Out of Stock'"></span>
            </button>
        </div>
    </div>

    <!-- Bottom: Tabs -->
    <div class="kirki-product-tabs" x-data="tabs({ activeTab: 'description' })">
        <div class="kirki-product-tab-header">
            <button class="kirki-product-tab-btn" :class="{ 'active': activeTab === 'description' }" @click="activeTab = 'description'">Description</button>
            <button class="kirki-product-tab-btn" :class="{ 'active': activeTab === 'specifications' }" @click="activeTab = 'specifications'">Specifications</button>
            <button class="kirki-product-tab-btn" :class="{ 'active': activeTab === 'reviews' }" @click="activeTab = 'reviews'">Reviews</button>
        </div>
        
        <div class="kirki-product-tab-content" :class="{ 'active': activeTab === 'description' }">
            <h3>Product Description</h3>
            <p>Our premium wireless headphones deliver exceptional sound quality with advanced audio technology. The active noise cancellation feature blocks out distractions, allowing you to focus on your music or calls. With up to 30 hours of battery life, you can enjoy uninterrupted listening throughout the day.</p>
            <p>The ergonomic design ensures comfort during extended wear, while the memory foam ear cushions provide a perfect fit. The headphones are compatible with all Bluetooth-enabled devices and feature quick-charge technology for added convenience.</p>
        </div>

        <div class="kirki-product-tab-content" :class="{ 'active': activeTab === 'specifications' }">
            <h3>Technical Specifications</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--kirki-color-border, #e2e8f0);"><strong>Driver Size:</strong> 40mm</li>
                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--kirki-color-border, #e2e8f0);"><strong>Frequency Response:</strong> 20Hz - 20kHz</li>
                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--kirki-color-border, #e2e8f0);"><strong>Impedance:</strong> 32 Ohm</li>
                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--kirki-color-border, #e2e8f0);"><strong>Battery Life:</strong> Up to 30 hours</li>
                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--kirki-color-border, #e2e8f0);"><strong>Charging Time:</strong> 2 hours</li>
                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--kirki-color-border, #e2e8f0);"><strong>Bluetooth Version:</strong> 5.0</li>
                <li style="padding: 0.5rem 0;"><strong>Weight:</strong> 250g</li>
            </ul>
        </div>

        <div class="kirki-product-tab-content" :class="{ 'active': activeTab === 'reviews' }">
            <h3>Customer Reviews</h3>
            <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <strong>John D.</strong>
                    <span style="color: #fbbf24;">★★★★★</span>
                </div>
                <p style="margin: 0; color: var(--kirki-color-text-sub, #52525b);">Amazing sound quality! The noise cancellation works perfectly.</p>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <strong>Sarah M.</strong>
                    <span style="color: #fbbf24;">★★★★☆</span>
                </div>
                <p style="margin: 0; color: var(--kirki-color-text-sub, #52525b);">Very comfortable for long sessions. Battery life is impressive.</p>
            </div>
            <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <strong>Mike R.</strong>
                    <span style="color: #fbbf24;">★★★★★</span>
                </div>
                <p style="margin: 0; color: var(--kirki-color-text-sub, #52525b);">Best headphones I've ever owned. Worth every penny!</p>
            </div>
        </div>
    </div>
</div>

<?php TemplateHelper::get_footer(); ?>
