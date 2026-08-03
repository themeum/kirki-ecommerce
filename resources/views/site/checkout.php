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

<div class="kirki-ecom-page-wrapper">
    <div class="kecom-checkout-page">
        <div class="kecom-checkout-grid">
            <!-- Left Column -->
            <div class="kecom-checkout-left">
                <!-- Billing Form -->
                <div class="kecom-billing-section">
                    <h2 class="kecom-section-title">Billing Details</h2>
                    <form class="kecom-billing-form">
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="country">Country/region</label>
                            <select class="kecom-select" id="country" name="country" required>
                                <option value="">Select Country</option>
                                <?php foreach ($countries as $country): ?>
                                    <option value="<?php echo esc_attr($country['code']); ?>">
                                        <?php echo esc_html($country['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="kecom-billing-form-row">
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="first-name">First Name</label>
                                <input class="kecom-input" type="text" id="first-name" name="first_name" required>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="last-name">Last Name</label>
                                <input class="kecom-input" type="text" id="last-name" name="last_name" required>
                            </div>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="address">Address</label>
                            <input class="kecom-input" type="text" id="address" name="address" required>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="apartment">
                                Apartment, suit, etc. <span class="kecom-text-subdued">(optional)</span>
                            </label>
                            <input class="kecom-input" type="text" id="apartment" name="apartment" required>
                        </div>
                        <div class="kecom-billing-form-row">
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="city">City</label>
                                <input class="kecom-input" type="text" id="city" name="city" required>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="state">State</label>
                                <input class="kecom-input" type="text" id="state" name="state" required>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="zipcode">Zip code</label>
                                <input class="kecom-input" type="text" id="zipcode" name="zipcode" required>
                            </div>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="phone">Phone Number</label>
                            <input class="kecom-input" type="tel" id="phone" name="phone">
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-checkbox">
                                <input class="kecom-checkbox-input" type="checkbox">
                                <span class="kecom-checkbox-label">Save this information for next time</span>
                            </label>
                        </div>
                    </form>
                </div>

                <!-- Payment Methods -->
                <div class="kecom-payment-section">
                    <h2 class="kecom-section-title">Payment</h2>
                    <div class="kecom-payment-methods">
                        <label class="kecom-radio kecom-payment-option">
                            <input class="kecom-radio-input" type="radio" name="payment_method" value="stripe" checked>
                            <span class="kecom-radio-label">
                                <span class="kecom-payment-name">Credit Card</span>
                            </span>
                        </label>
                        <label class="kecom-radio kecom-payment-option">
                            <input class="kecom-radio-input" type="radio" name="payment_method" value="paypal">
                            <span class="kecom-radio-label">
                                <span class="kecom-payment-name">PayPal</span>
                            </span>
                            <div class="kecom-payment-logo">
                                <img src="<?php echo esc_url(KIRKI_ECOMMERCE_ASSETS_URL . '/images/paypal.svg') ?>" alt="PayPal" class="kecom-payment-logo-img">
                            </div>
                        </label>
                        <label class="kecom-radio kecom-payment-option">
                            <input class="kecom-radio-input" type="radio" name="payment_method" value="bank_transfer">
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
                        <h2 class="kecom-section-title">Order Summary <span class="kecom-text-subdued">(4)</span></h2>
                        <a href="#" class="kecom-products-section-modify">Modify</a>
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
                <form class="kecom-form kecom-coupon-form">
                    <div class="kecom-field">
                        <input class="kecom-input" type="text" id="coupon-code" name="coupon_code" placeholder="Discount code">
                    </div>
                    <button type="submit" class="kecom-btn kecom-btn-secondary">Apply</button>
                </form>

                <hr />

                <!-- Order Summary -->
                <div class="kecom-order-summary">
                    <div class="kecom-summary-row">
                        <span>Subtotal</span>
                        <span class="kecom-summary-value">$129.97</span>
                    </div>
                    <div class="kecom-summary-row">
                        <span>Shipping</span>
                        <span class="kecom-summary-value">$5.00</span>
                    </div>
                    <div class="kecom-summary-row">
                        <span>Discount</span>
                        <span class="kecom-summary-value">-$0.00</span>
                    </div>
                    <div class="kecom-summary-row kecom-total-row">
                        <span>Total</span>
                        <span class="kecom-summary-value kecom-total-value">$134.97</span>
                    </div>
                </div>

                <!-- Pay Button -->
                <button type="submit" class="kecom-btn kecom-btn-primary kecom-btn-lg kecom-pay-btn">Place Order</button>
            </div>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>