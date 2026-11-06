<?php

/**
 * Payment Methods Part
 *
 * @package Kirki\Ecommerce\Templates
 */

use Kirki\Ecommerce\App\Supports\Icon;

defined('ABSPATH') || exit;

$payment_gateways = $data['payment_gateways'] ?? [];
$payment_notice = $data['payment_notice'] ?? null;
?>

<!-- Payment Methods -->
<div class="kecom-payment-section">
    <h2 class="kecom-section-title"><?php esc_html_e('Payment', 'kirki-ecommerce'); ?></h2>
    <div class="kecom-payment-methods">
        <?php if (empty($payment_gateways)) : ?>
            <div class="kecom-text-base kecom-text-subdued">
                <?php if ($payment_notice) : ?>
                    <?php echo esc_html($payment_notice); ?>
                <?php else : ?>
                    <?php esc_html_e('No payment methods found!', 'kirki-ecommerce'); ?>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        <?php foreach ($payment_gateways as $payment_gateway) : ?>
            <label class="kecom-radio kecom-payment-option">
                <input class="kecom-radio-input"
                    type="radio"
                    name="payment_provider"
                    value="<?php echo esc_attr($payment_gateway->id()); ?>"
                    x-model="selectedPaymentMethod"
                    @change="setPaymentMethod('<?php echo esc_attr($payment_gateway->id()); ?>')">
                <div class="kecom-radio-label">
                    <div class="kecom-payment-header">
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
                    <?php if ($payment_gateway->description()) : ?>
                        <div class="kirki-ecommerce-rich-text kecom-payment-description"
                            x-show="selectedPaymentMethod === '<?php echo esc_attr($payment_gateway->id()); ?>'"
                            x-cloak>
                            <?php echo wp_kses_post($payment_gateway->description()); ?>
                        </div>
                    <?php endif; ?>
                </div>
            </label>
        <?php endforeach; ?>
    </div>
    <div x-show="paymentMethodError" x-cloak class="kecom-alert kecom-alert-error kecom-mt-4">
        <?php Icon::render('info', ['size' => 20]); ?>
        <p x-text="paymentMethodError"></p>
    </div>
</div>