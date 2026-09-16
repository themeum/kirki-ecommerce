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
<div>
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
                placeholder="<?php esc_html_e('Enter your discount code here', 'kirki-ecommerce'); ?>"
                x-model="couponCode"
                @input="couponError = ''">
            <span class="kecom-field-error" x-show="couponError" x-text="couponError" x-cloak></span>
        </div>
        <button type="submit" class="kecom-btn kecom-btn-secondary" :class="{ 'kecom-btn-loading': isApplyingCoupon }" :disabled="couponLoading">
            <?php esc_html_e('Apply Discount', 'kirki-ecommerce'); ?>
        </button>
    </form>

    <div x-show="appliedCoupons?.length > 0" class="kecom-applied-coupons" x-cloak>
        <template x-for="appliedCoupon in appliedCoupons" :key="appliedCoupon.code">
            <div class="kecom-tag">
                <span class="kecom-tag-icon">
                    <?php Icon::render('tag', ['size' => 16]); ?>
                </span>
                <span class="kecom-tag-text" x-text="appliedCoupon.code"></span>
                <button
                    type="button"
                    class="kecom-tag-remove"
                    @click="removeCoupon(appliedCoupon)"
                    :class="{ 'kecom-btn-loading': removingCouponCode === appliedCoupon.code }"
                    :disabled="couponLoading"
                    aria-label="<?php esc_attr_e('Remove discount code', 'kirki-ecommerce'); ?>">
                    <?php Icon::render('cross', ['size' => 16]); ?>
                </button>
            </div>
        </template>
    </div>
</div>
