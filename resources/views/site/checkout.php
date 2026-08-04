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

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\view_data;

$data = (object) view_data();
$countries = $data->countries ?? [];
$payment_gateways = $data->payment_gateways ?? [];

$customer = $data->customer->get_customer() ?? null;
$billing_address = $data->customer->get_billing_address();
$shipping_address = $data->customer->get_shipping_address();

// Shipping Info.
$shipping_first_name = $shipping_address->first_name ?? '';
$shipping_last_name = $shipping_address->last_name ?? '';
$shipping_address_line1 = $shipping_address->address_line1 ?? '';
$shipping_address_line2 = $shipping_address->address_line2 ?? '';

$shipping_city = $shipping_address->city ?? '';
$shipping_state = $shipping_address->state ?? '';
$shipping_country = $shipping_address->country ?? '';
$shipping_postal_code = $shipping_address->postal_code ?? '';

$shipping_phone = $shipping_address->phone ?? '';
$shipping_email = $shipping_address->email ?? '';

// Billing Info.
$billing_first_name = $billing_address->first_name ?? '';
$billing_last_name = $billing_address->last_name ?? '';
$billing_address_line1 = $billing_address->address_line1 ?? '';
$billing_address_line2 = $billing_address->address_line2 ?? '';

$billing_city = $billing_address->city ?? '';
$billing_state = $billing_address->state ?? '';
$billing_country = $billing_address->country ?? '';
$billing_postal_code = $billing_address->postal_code ?? '';

$billing_phone = $billing_address->phone ?? '';
$billing_email = $billing_address->email ?? '';

$cart = $data->cart ?? null;
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper" x-data="checkout()">
    <div class="kecom-checkout-page">
        <div class="kecom-checkout-grid">
            <!-- Left Column -->
            <div class="kecom-checkout-left">
                <!-- Shipping Form -->
                <div class="kecom-billing-section">
                    <h2 class="kecom-section-title"><?php esc_html_e('Shipping Details', 'kirki-ecommerce'); ?></h2>
                    <form id="shipping-form" class="kecom-billing-form kecom-form" x-data="form({
                        defaultValues: {
                            country: '<?php echo esc_js($shipping_country); ?>',
                            first_name: '<?php echo esc_js($shipping_first_name); ?>',
                            last_name: '<?php echo esc_js($shipping_last_name); ?>',
                            address_line1: '<?php echo esc_js($shipping_address_line1); ?>',
                            address_line2: '<?php echo esc_js($shipping_address_line2); ?>',
                            city: '<?php echo esc_js($shipping_city); ?>',
                            state: '<?php echo esc_js($shipping_state); ?>',
                            postal_code: '<?php echo esc_js($shipping_postal_code); ?>',
                            phone: '<?php echo esc_js($shipping_phone); ?>',
                            email: '<?php echo esc_js($shipping_email); ?>',
                        },
                        mode: 'onBlur'
                   })" @validate-shipping-form.window="await validateForm(); $dispatch('shipping-form-validated', { isValid })">
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="shipping-country"><?php esc_html_e('Country/region', 'kirki-ecommerce'); ?></label>
                            <select class="kecom-select" id="shipping-country" name="country" x-bind="register('country', { required: '<?php esc_html_e('Country is required', 'kirki-ecommerce'); ?>' })">
                                <option value=""><?php esc_html_e('Select Country', 'kirki-ecommerce'); ?></option>
                                <?php foreach ($countries as $country) : ?>
                                    <option value="<?php echo esc_attr($country['code']); ?>">
                                        <?php echo esc_html($country['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <span class="kecom-field-error" x-show="errors.country" x-text="errors.country"></span>
                        </div>
                        <div class="kecom-billing-form-row">
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="shipping-first-name"><?php esc_html_e('First Name', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="shipping-first-name" 
                                    name="first_name" 
                                    x-bind="register('first_name', { required: '<?php esc_html_e('First name is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.first_name" x-text="errors.first_name"></span>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="shipping-last-name"><?php esc_html_e('Last Name', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="shipping-last-name" 
                                    name="last_name" 
                                    x-bind="register('last_name', { required: '<?php esc_html_e('Last name is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.last_name" x-text="errors.last_name"></span>
                            </div>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="shipping-address-line1"><?php esc_html_e('Address', 'kirki-ecommerce'); ?></label>
                            <input 
                                class="kecom-input" 
                                type="text" 
                                id="shipping-address-line1" 
                                name="address_line1" 
                                x-bind="register('address_line1', { required: '<?php esc_html_e('Address is required', 'kirki-ecommerce'); ?>' })">
                            <span class="kecom-field-error" x-show="errors.address_line1" x-text="errors.address_line1"></span>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="shipping-address-line2">
                                <?php esc_html_e('Apartment, suit, etc.', 'kirki-ecommerce'); ?> <span class="kecom-text-subdued">(<?php esc_html_e('optional', 'kirki-ecommerce'); ?>)</span>
                            </label>
                            <input class="kecom-input" type="text" id="shipping-address-line2" name="address_line2" x-bind="register('address_line2')">
                        </div>
                        <div class="kecom-billing-form-row">
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="shipping-city"><?php esc_html_e('City', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="shipping-city" 
                                    name="city" 
                                    x-bind="register('city', { required: '<?php esc_html_e('City is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.city" x-text="errors.city"></span>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="shipping-state"><?php esc_html_e('State', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="shipping-state" 
                                    name="state" 
                                    x-bind="register('state', { required: '<?php esc_html_e('State is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.state" x-text="errors.state"></span>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="shipping-postal-code"><?php esc_html_e('Postal code', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="shipping-postal-code" 
                                    name="postal_code" 
                                    x-bind="register('postal_code', { required: '<?php esc_html_e('Postal code is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.postal_code" x-text="errors.postal_code"></span>
                            </div>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="shipping-phone"><?php esc_html_e('Phone Number', 'kirki-ecommerce'); ?></label>
                            <input 
                                class="kecom-input" 
                                type="tel" 
                                id="shipping-phone" 
                                name="phone" 
                                x-bind="register('phone', { required: '<?php esc_html_e('Phone number is required', 'kirki-ecommerce'); ?>' })">
                            <span class="kecom-field-error" x-show="errors.phone" x-text="errors.phone"></span>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-checkbox">
                                <input class="kecom-checkbox-input" type="checkbox" x-model="billingSameAsShipping">
                                <span class="kecom-checkbox-label"><?php esc_html_e('The billing address is same as shipping address.', 'kirki-ecommerce'); ?></span>
                            </label>
                        </div>
                    </form>
                </div>

                <!-- Billing Form -->
                <div class="kecom-billing-section">
                    <h2 class="kecom-section-title"><?php esc_html_e('Billing Details', 'kirki-ecommerce'); ?></h2>
                    <form id="billing-form" class="kecom-billing-form kecom-form" x-data="form({
                        defaultValues: {
                            country: '<?php echo esc_js($billing_country); ?>',
                            first_name: '<?php echo esc_js($billing_first_name); ?>',
                            last_name: '<?php echo esc_js($billing_last_name); ?>',
                            address_line1: '<?php echo esc_js($billing_address_line1); ?>',
                            address_line2: '<?php echo esc_js($billing_address_line2); ?>',
                            city: '<?php echo esc_js($billing_city); ?>',
                            state: '<?php echo esc_js($billing_state); ?>',
                            postal_code: '<?php echo esc_js($billing_postal_code); ?>',
                            phone: '<?php echo esc_js($billing_phone); ?>',
                            email: '<?php echo esc_js($billing_email); ?>'
                        },
                        mode: 'onBlur'
                   })" @validate-billing-form.window="await validateForm(); $dispatch('billing-form-validated', { isValid })">
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="billing-country"><?php esc_html_e('Country/region', 'kirki-ecommerce'); ?></label>
                            <select class="kecom-select" id="billing-country" name="country" x-bind="register('country', { required: '<?php esc_html_e('Country is required', 'kirki-ecommerce'); ?>' })">
                                <option value=""><?php esc_html_e('Select Country', 'kirki-ecommerce'); ?></option>
                                <?php foreach ($countries as $country) : ?>
                                    <option value="<?php echo esc_attr($country['code']); ?>">
                                        <?php echo esc_html($country['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <span class="kecom-field-error" x-show="errors.country" x-text="errors.country"></span>
                        </div>
                        <div class="kecom-billing-form-row">
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="billing-first-name"><?php esc_html_e('First Name', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="billing-first-name" 
                                    name="first_name" 
                                    x-bind="register('first_name', { required: '<?php esc_html_e('First name is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.first_name" x-text="errors.first_name"></span>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="billing-last-name"><?php esc_html_e('Last Name', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="billing-last-name" 
                                    name="last_name" 
                                    x-bind="register('last_name', { required: '<?php esc_html_e('Last name is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.last_name" x-text="errors.last_name"></span>
                            </div>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="billing-address-line1"><?php esc_html_e('Address', 'kirki-ecommerce'); ?></label>
                            <input 
                                class="kecom-input" 
                                type="text" 
                                id="billing-address-line1" 
                                name="address_line1" 
                                x-bind="register('address_line1', { required: '<?php esc_html_e('Address is required', 'kirki-ecommerce'); ?>' })">
                            <span class="kecom-field-error" x-show="errors.address_line1" x-text="errors.address_line1"></span>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="billing-address-line2">
                                <?php esc_html_e('Apartment, suit, etc.', 'kirki-ecommerce'); ?> <span class="kecom-text-subdued">(<?php esc_html_e('optional', 'kirki-ecommerce'); ?>)</span>
                            </label>
                            <input class="kecom-input" type="text" id="billing-address-line2" name="address_line2" x-bind="register('address_line2')">
                        </div>
                        <div class="kecom-billing-form-row">
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="billing-city"><?php esc_html_e('City', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="billing-city" 
                                    name="city" 
                                    x-bind="register('city', { required: '<?php esc_html_e('City is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.city" x-text="errors.city"></span>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="billing-state"><?php esc_html_e('State', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="billing-state" 
                                    name="state" 
                                    x-bind="register('state', { required: '<?php esc_html_e('State is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.state" x-text="errors.state"></span>
                            </div>
                            <div class="kecom-field">
                                <label class="kecom-field-label" for="billing-postal-code"><?php esc_html_e('Postal code', 'kirki-ecommerce'); ?></label>
                                <input 
                                    class="kecom-input" 
                                    type="text" 
                                    id="billing-postal-code" 
                                    name="postal_code" 
                                    x-bind="register('postal_code', { required: '<?php esc_html_e('Postal code is required', 'kirki-ecommerce'); ?>' })">
                                <span class="kecom-field-error" x-show="errors.postal_code" x-text="errors.postal_code"></span>
                            </div>
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="billing-phone"><?php esc_html_e('Phone Number', 'kirki-ecommerce'); ?></label>
                            <input 
                                class="kecom-input" 
                                type="tel" 
                                id="billing-phone" 
                                name="phone" 
                                x-bind="register('phone', { required: '<?php esc_html_e('Phone number is required', 'kirki-ecommerce'); ?>' })">
                            <span class="kecom-field-error" x-show="errors.phone" x-text="errors.phone"></span>
                        </div>
                    </form>
                </div>

                <!-- Payment Methods -->
                <div class="kecom-payment-section">
                    <h2 class="kecom-section-title"><?php esc_html_e('Payment', 'kirki-ecommerce'); ?></h2>
                    <div class="kecom-payment-methods">
                        <?php foreach ($payment_gateways as $payment_gateway) : ?>
                            <label class="kecom-radio kecom-payment-option">
                                <input class="kecom-radio-input" 
                                        type="radio" 
                                        name="payment_method" 
                                        value="<?php echo esc_attr($payment_gateway->id()); ?>" 
                                        x-model="selectedPaymentMethod" 
                                        @change="setPaymentMethod('<?php echo esc_attr($payment_gateway->id()); ?>')" checked>
                                <span class="kecom-radio-label">
                                    <span class="kecom-payment-name">
                                        <?php echo esc_html($payment_gateway->title()); ?>
                                    </span>
                                </span>
                                <?php if ($payment_gateway->icon()) :?>
                                <div class="kecom-payment-logo">
                                    <img src="<?php echo esc_url($payment_gateway->icon()); ?>"
                                        alt="<?php echo esc_attr($payment_gateway->title()); ?>" 
                                        class="kecom-payment-logo-img">
                                </div>
                                <?php endif; ?>
                            </label>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="kecom-checkout-right">
                <!-- Product List -->
                <div class="kecom-products-section">
                    <?php
                        $cart_items = $cart['items'] ?? [];
                        $items_count = $cart['items_count'] ?? count($cart_items);
                        $currency_code = $cart['currency']['code'] ?? 'USD';
                    ?>
                    <div class="kecom-products-section-title">
                        <h2 class="kecom-section-title"><?php esc_html_e('Order Summary', 'kirki-ecommerce'); ?> <span class="kecom-text-subdued">(<?php echo esc_html($items_count); ?>)</span></h2>
                        <a href="<?php echo esc_url(Url::get_cart_url()); ?>" class="kecom-products-section-modify"><?php esc_html_e('Modify', 'kirki-ecommerce'); ?></a>
                    </div>
                    <div class="kecom-product-list">
                        <?php foreach ($cart_items as $item) :
                            $product = $item['product'] ?? null;

                            if (!$product) {
                                continue;
                            }

                            // Product image from CartResource media.
                            $media = $product['media'] ?? null;
                            $image_url = null;

                            if (!empty($media['url'])) {
                                $image_url = $media['url'];
                            } elseif (!empty($media['id'])) {
                                $image_url = wp_get_attachment_image_url($media['id'], 'thumbnail');
                            }

                            if (!$image_url) {
                                $image_url = Assets::get_url('images/product-fallback.webp');
                            }

                            // Prices from CartResource.
                            $price = $product['price'] ?? 0;
                            $sale_price = $product['sale_price'] ?? 0;
                            $quantity = $item['quantity'] ?? 1;
                            $item_total = $item['total'] ?? 0;
                            $item_subtotal = $item['subtotal'] ?? 0;

                            $formatted_total = Money::format_from_decimal($item_total, $currency_code);
                            $has_sale = $sale_price->isGreaterThan(0) && !$sale_price->isEqualTo($price);
                            $formatted_regular_total = $has_sale ? Money::format_from_decimal($price->multipliedBy($quantity), $currency_code) : '';
                            ?>
                        <div class="kecom-product-item">
                            <div class="kecom-product-image-wrapper">
                                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($product['title'] ?? ''); ?>" class="kecom-product-image">
                                <span class="kecom-product-qty-badge"><?php echo esc_html($quantity); ?></span>
                            </div>
                            <div class="kecom-product-info">
                                <h3 class="kecom-product-name"><?php echo esc_html($product['title'] ?? ''); ?></h3>
                            </div>
                            <div class="kecom-product-price-wrapper">
                                <span class="kecom-product-price"><?php echo esc_html($formatted_total); ?></span>
                                <?php if ($formatted_regular_total) : ?>
                                    <span class="kecom-product-discount"><?php echo esc_html($formatted_regular_total); ?></span>
                                <?php endif; ?>
                            </div>
                        </div>
                        <?php endforeach; ?>
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
                <?php
                    $pricing = $cart['pricing'] ?? [];
                    $formatted_subtotal = Money::format_from_decimal($pricing['subtotal'] ?? 0);
                    $formatted_shipping = Money::format_from_decimal($pricing['shipping_total'] ?? 0);
                    $formatted_discount = Money::format_from_decimal($pricing['discount_total'] ?? 0);
                    $formatted_total = Money::format_from_decimal($pricing['total'] ?? 0);
                ?>
                <div class="kecom-order-summary">
                    <div class="kecom-summary-row">
                        <span><?php esc_html_e('Subtotal', 'kirki-ecommerce'); ?></span>
                        <span class="kecom-summary-value" x-text="cartData ? cartData.pricing.subtotal_formatted : '<?php echo esc_js($formatted_subtotal); ?>'"><?php echo esc_html($formatted_subtotal); ?></span>
                    </div>
                    <div class="kecom-summary-row">
                        <span><?php esc_html_e('Shipping', 'kirki-ecommerce'); ?></span>
                        <span class="kecom-summary-value" x-text="cartData ? currency + parseFloat(cartData.pricing.shipping_total).toFixed(2) : '<?php echo esc_js($formatted_shipping); ?>'"><?php echo esc_html($formatted_shipping); ?></span>
                    </div>
                    <div class="kecom-summary-row" x-show="discount > 0">
                        <span><?php esc_html_e('Discount', 'kirki-ecommerce'); ?></span>
                        <span class="kecom-summary-value" x-text="'-' + currency + discount.toFixed(2)">-<?php echo esc_html($formatted_discount); ?></span>
                    </div>
                    <div class="kecom-summary-row kecom-total-row">
                        <span><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
                        <span class="kecom-summary-value kecom-total-value" x-text="cartData ? cartData.pricing.total_formatted : '<?php echo esc_js($formatted_total); ?>'"><?php echo esc_html($formatted_total); ?></span>
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