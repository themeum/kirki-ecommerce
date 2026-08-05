<?php
/**
 * Place Order Button Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;
extract($data);
?>

<!-- Pay Button -->
<button type="button" class="kecom-btn kecom-btn-primary kecom-btn-lg kecom-pay-btn" :class="{ 'kecom-btn-loading': loading }" :disabled="loading" @click="placeOrder">
    <?php esc_html_e('Place Order', 'kirki-ecommerce'); ?>
</button>
