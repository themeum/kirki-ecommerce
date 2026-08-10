<?php

/**
 * Coupon Form Part
 *
 * @package Kirki\Ecommerce\Templates
 */

use Kirki\Ecommerce\App\Supports\Icon;

defined('ABSPATH') || exit;
extract($data);
?>

<!-- Coupon Form -->
<div x-show="!cartData?.pricing?.discount_details?.code">
    <form class="kecom-form kecom-coupon-form" x-data="{ couponError: '' }" @submit.prevent="
        if (!couponCode.trim()) {
            couponError = '<?php esc_html_e('Please enter a discount code', 'kirki-ecommerce'); ?>';
            return;
        }
        couponError = '';
        applyCoupon();
    ">
        <div class="kecom-field" :class="{ 'kecom-field-error-state': couponError }">
            <input
                class="kecom-input"
                type="text"
                id="coupon-code"
                name="coupon_code"
                placeholder="<?php esc_html_e('Discount code', 'kirki-ecommerce'); ?>"
                x-model="couponCode"
                @input="couponError = ''">
            <span class="kecom-field-error" x-show="couponError" x-text="couponError" x-cloak></span>
        </div>
        <button type="submit" class="kecom-btn kecom-btn-secondary" :class="{ 'kecom-btn-loading': couponLoading }" :disabled="couponLoading">
            <?php esc_html_e('Apply', 'kirki-ecommerce'); ?>
        </button>
    </form>
</div>
<div x-show="cartData?.pricing?.discount_details?.code" class="kecom-applied-coupon" x-cloak>
    <div class="kecom-applied-coupon-info">
        <div class="kecom-applied-coupon-code-wrapper">
            <span class="kecom-coupon-code" x-text="cartData.pricing?.discount_details?.code"></span>
            <span class="kecom-badge kecom-badge-success-light kecom-coupon-discount" x-text="
                cartData.pricing?.discount_details?.discount_value_type === 'percentage'
                    ? cartData.pricing.discount_details.discount_amount_percentage + '% off'
                    : (cartData.pricing?.discount_details?.discount_amount_fixed
                        ? currency + parseFloat(cartData.pricing.discount_details.discount_amount_fixed).toFixed(2) + ' off'
                        : '')
            "></span>
        </div>
        <button type="button" class="kecom-btn kecom-btn-link" @click="removeCoupon" :class="{ 'kecom-btn-loading': couponLoading }" :disabled="couponLoading">
            <?php Icon::render('cross'); ?>
        </button>
    </div>
    <div class="kecom-text-sm kecom-text-brand">
        <?php esc_html_e('Coupon code applied successfully', 'kirki-ecommerce'); ?>
    </div>
</div>
