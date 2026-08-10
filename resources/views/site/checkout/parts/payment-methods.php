<?php

/**
 * Payment Methods Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;

$payment_gateways = $data['payment_gateways'] ?? [];
?>

<!-- Payment Methods -->
<div class="kecom-payment-section">
    <h2 class="kecom-section-title"><?php esc_html_e('Payment', 'kirki-ecommerce'); ?></h2>
    <div class="kecom-payment-methods">
        <?php foreach ($payment_gateways as $payment_gateway) : ?>
            <label class="kecom-radio kecom-payment-option">
                <input class="kecom-radio-input"
                    type="radio"
                    name="payment_provider"
                    value="<?php echo esc_attr($payment_gateway->id()); ?>"
                    x-model="selectedPaymentMethod"
                    @change="setPaymentMethod('<?php echo esc_attr($payment_gateway->id()); ?>')">
                <div class="kecom-radio-label">
                    <?php if ($payment_gateway->icon()) : ?>
                        <div class="kecom-payment-logo">
                            <img src="<?php echo esc_url($payment_gateway->icon()); ?>"
                                alt="<?php echo esc_attr($payment_gateway->title()); ?>"
                                class="kecom-payment-logo-img">
                        </div>
                    <?php endif; ?>
                    <span class="kecom-payment-name">
                        <?php echo esc_html($payment_gateway->title()); ?>
                    </span>
                </div>
            </label>
        <?php endforeach; ?>
    </div>
</div>