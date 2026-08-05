<?php
/**
 * Coupon Form Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;
extract($data);
?>

<!-- Coupon Form -->
<form class="kecom-form kecom-coupon-form" @submit.prevent="applyCoupon">
    <div class="kecom-field">
        <input class="kecom-input" type="text" id="coupon-code" name="coupon_code" placeholder="<?php esc_html_e('Discount code', 'kirki-ecommerce'); ?>" x-model="couponCode">
    </div>
    <button type="submit" class="kecom-btn kecom-btn-secondary" :class="{ 'kecom-btn-loading': couponLoading }" :disabled="couponLoading">
            <?php esc_html_e('Apply', 'kirki-ecommerce'); ?>
    </button>
</form>
