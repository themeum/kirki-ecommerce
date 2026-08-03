<?php

/**
 * Checkout Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Template;

$countries_json = file_get_contents(plugin_dir_path(__FILE__) . '../../data/countries.json');
$countries = json_decode($countries_json, true);
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper" x-data="checkout()">
    <div class="kecom-checkout-page">
        <div class="kecom-checkout-grid">
            <!-- Left Column -->
            <div class="kecom-checkout-left">
                <!-- Billing Form -->
                <div class="kecom-billing-section">
                    <h2 class="kecom-section-title"><?php esc_html_e('Billing Details', 'kirki-ecommerce'); ?></h2>
                    <form class="kecom-billing-form kecom-form" x-data="form({
                        defaultValues: {
                            country: '',
                            first_name: '',
                            last_name: '',
                            address: '',
                            apartment: '',
                            city: '',
                            state: '',
                            zipcode: '',
                            phone: '',
                            save_info: false
                        },
                        mode: 'onBlur'
                    })" @validate-billing-form.window="validateForm()">
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="country">Country/region</label>
                            <select class="kecom-select" id="country" name="country" x-bind="register('country', { required: '<?php esc_html_e('Country is required', 'kirki-ecommerce'); ?>' })">
                                <option value=""><?php esc_html_e('Select Country', 'kirki-ecommerce'); ?></option>
                                <?php foreach ($countries as $country): ?>
                                    <option value="<?php echo esc_attr($country['code']); ?>">
                                        <?php echo esc_html($country['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <span class="kecom-field-error" x-show="errors.country" x-text="errors.country"></span>
                        </div>
                        <div class="kecom-billing-form-row">
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="first-name"><?php esc_html_e('First Name', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="first-name" 
                                    name="first_name" 
                                    x-bind="register('first_name', { required: '<?php esc_html_e('First name is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.first_name" x-text="errors.first_name"></span>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="last-name"><?php esc_html_e('Last Name', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="last-name" 
                                    name="last_name" 
                                    x-bind="register('last_name', { required: '<?php esc_html_e('Last name is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.last_name" x-text="errors.last_name"></span>
                            </div>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="address"><?php esc_html_e('Address', 'kirki-ecommerce'); ?></label>
                            <input 
                                class="kecom-input" 
                                type="text" 
                                id="address" 
                                name="address" 
                                x-bind="register('address', { required: '<?php esc_html_e('Address is required', 'kirki-ecommerce'); ?>' })">
                            <span class="kecom-field-error" x-show="errors.address" x-text="errors.address"></span>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="apartment">
                                <?php esc_html_e('Apartment, suit, etc.', 'kirki-ecommerce'); ?> <span class="kecom-text-subdued">(<?php esc_html_e('optional', 'kirki-ecommerce'); ?>)</span>
                            </label>
                            <input class="kecom-input" type="text" id="apartment" name="apartment" x-bind="register('apartment')">
                        </div>
                        <div class="kecom-billing-form-row">
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="city"><?php esc_html_e('City', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="city" 
                                    name="city" 
                                    x-bind="register('city', { required: '<?php esc_html_e('City is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.city" x-text="errors.city"></span>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="state"><?php esc_html_e('State', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="state" 
                                    name="state" 
                                    x-bind="register('state', { required: '<?php esc_html_e('State is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.state" x-text="errors.state"></span>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="zipcode"><?php esc_html_e('Zip code', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="zipcode" 
                                    name="zipcode" 
                                    x-bind="register('zipcode', { required: '<?php esc_html_e('Zip code is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.zipcode" x-text="errors.zipcode"></span>
                            </div>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="phone"><?php esc_html_e('Phone Number', 'kirki-ecommerce'); ?></label>
                            <input 
                                class="kecom-input" 
                                type="tel" 
                                id="phone" 
                                name="phone" 
                                x-bind="register('phone', { pattern: { value: /^[\d\s\-\(\)]+$/, message: '<?php esc_html_e('Invalid phone number format', 'kirki-ecommerce'); ?>' } })">
                            <span class="kecom-field-error" x-show="errors.phone" x-text="errors.phone"></span>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-checkbox">
                                <input class="kecom-checkbox-input" type="checkbox" x-bind="register('save_info')">
                                <span class="kecom-checkbox-label"><?php esc_html_e('Save this information for next time', 'kirki-ecommerce'); ?></span>
                            </label>
                        </div>
                    </form>
                </div>

                <!-- Payment Methods -->
                <div class="kecom-payment-section">
                    <h2 class="kecom-section-title"><?php esc_html_e('Payment', 'kirki-ecommerce'); ?></h2>
                    <div class="kecom-payment-methods">
                        <label class="kecom-radio kecom-payment-option">
                            <input class="kecom-radio-input" type="radio" name="payment_method" value="stripe" x-model="selectedPaymentMethod" @change="setPaymentMethod('stripe')" checked>
                            <span class="kecom-radio-label">
                                <span class="kecom-payment-name">Credit Card</span>
                            </span>
                        </label>
                        <label class="kecom-radio kecom-payment-option">
                            <input class="kecom-radio-input" type="radio" name="payment_method" value="paypal" x-model="selectedPaymentMethod" @change="setPaymentMethod('paypal')">
                            <span class="kecom-radio-label">
                                <span class="kecom-payment-name">PayPal</span>
                            </span>
                            <div class="kecom-payment-logo">
                                <img src="<?php echo esc_url(KIRKI_ECOMMERCE_ASSETS_URL . '/images/paypal.svg') ?>" alt="PayPal" class="kecom-payment-logo-img">
                            </div>
                        </label>
                        <label class="kecom-radio kecom-payment-option">
                            <input class="kecom-radio-input" type="radio" name="payment_method" value="bank_transfer" x-model="selectedPaymentMethod" @change="setPaymentMethod('bank_transfer')">
                            <span class="kecom-radio-label">
                                <span class="kecom-payment-name">Bank Transfer</span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="kecom-checkout-right">
                <!-- Product List -->
                <div class="kecom-products-section">
                    <div class="kecom-products-section-title">
                        <h2 class="kecom-section-title"><?php esc_html_e('Order Summary', 'kirki-ecommerce'); ?> <span class="kecom-text-subdued">(4)</span></h2>
                        <a href="#" class="kecom-products-section-modify"><?php esc_html_e('Modify', 'kirki-ecommerce'); ?></a>
                    </div>
                    <div class="kecom-product-list">
                        <div class="kecom-product-item">
                            <div class="kecom-product-image-wrapper">
                                <img src="http://localhost:10033/wp-content/uploads/2026/07/f4cc2a63021f31d8831021cde23b184119c17f40.png" alt="Product 1" class="kecom-product-image">
                                <span class="kecom-product-qty-badge">1</span>
                            </div>
                            <div class="kecom-product-info">
                                <h3 class="kecom-product-name">Product Name 1</h3>
                                <p class="kecom-product-category">Category</p>
                                <p class="kecom-product-variant">
                                    <span>L</span>
                                    <span>Blue</span>
                                </p>
                            </div>
                            <div class="kecom-product-price-wrapper">
                                <span class="kecom-product-price">$49.99</span>
                                <span class="kecom-product-discount">$59.99</span>
                            </div>
                        </div>
                        <div class="kecom-product-item">
                            <div class="kecom-product-image-wrapper">
                                <img src="http://localhost:10033/wp-content/uploads/2026/07/f4cc2a63021f31d8831021cde23b184119c17f40.png" alt="Product 2" class="kecom-product-image">
                                <span class="kecom-product-qty-badge">2</span>
                            </div>
                            <div class="kecom-product-info">
                                <h3 class="kecom-product-name">Product Name 2</h3>
                                <p class="kecom-product-category">Category</p>
                                <p class="kecom-product-variant">
                                    <span>M</span>
                                </p>
                            </div>
                            <div class="kecom-product-price-wrapper">
                                <span class="kecom-product-price">$79.98</span>
                                <span class="kecom-product-discount">$99.99</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Coupon Form -->
                <form class="kecom-form kecom-coupon-form" @submit.prevent="applyCoupon">
                    <div class="kecom-field">
                        <input class="kecom-input" type="text" id="coupon-code" name="coupon_code" placeholder="<?php esc_html_e('Discount code', 'kirki-ecommerce'); ?>" x-model="couponCode">
                    </div>
                    <button type="submit" class="kecom-btn kecom-btn-secondary" :class="{ 'kecom-btn-loading': couponLoading }" :disabled="couponLoading">
                        <?php esc_html_e('Apply', 'kirki-ecommerce'); ?>
                    </button>
                </form>

                <hr />

                <!-- Order Summary -->
                <div class="kecom-order-summary">
                    <div class="kecom-summary-row">
                        <span><?php esc_html_e('Subtotal', 'kirki-ecommerce'); ?></span>
                        <span class="kecom-summary-value">$129.97</span>
                    </div>
                    <div class="kecom-summary-row">
                        <span><?php esc_html_e('Shipping', 'kirki-ecommerce'); ?></span>
                        <span class="kecom-summary-value">$5.00</span>
                    </div>
                    <div class="kecom-summary-row">
                        <span><?php esc_html_e('Discount', 'kirki-ecommerce'); ?></span>
                        <span class="kecom-summary-value">-$0.00</span>
                    </div>
                    <div class="kecom-summary-row kecom-total-row">
                        <span><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
                        <span class="kecom-summary-value kecom-total-value">$134.97</span>
                    </div>
                </div>

                <!-- Pay Button -->
                <button type="button" class="kecom-btn kecom-btn-primary kecom-btn-lg kecom-pay-btn" :class="{ 'kecom-btn-loading': loading }" :disabled="loading" @click="placeOrder">
                    <?php esc_html_e('Place Order', 'kirki-ecommerce'); ?>
                </button>
            </div>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>