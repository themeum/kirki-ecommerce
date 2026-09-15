<?php

/**
 * Checkout Legal Consents.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\ConsentMethods;
use Kirki\Ecommerce\App\Supports\Icon;

$consents = $data['consents'] ?? [];

if (empty($consents)) {
    return;
}
?>

<div class="kecom-consent-section">
    <?php foreach ($consents as $consent) : ?>
        <?php $is_checkbox = in_array($consent['method'], ConsentMethods::get_checkbox_methods(), true); ?>

        <?php if (! $is_checkbox) : ?>
            <p class="kecom-consent-text"><?php echo wp_kses_post($consent['html']); ?></p>
        <?php else : ?>
            <label class="kecom-checkbox kecom-consent">
                <input
                    class="kecom-checkbox-input"
                    type="checkbox"
                    x-model="consents['<?php echo esc_attr($consent['id']); ?>']">
                <span class="kecom-checkbox-label">
                    <?php echo wp_kses_post($consent['html']); ?>
                </span>
            </label>
        <?php endif; ?>
    <?php endforeach; ?>

    <div x-show="consentError" x-cloak class="kecom-alert kecom-alert-error kecom-mt-4">
        <?php Icon::render('information', ['size' => 20]); ?>
        <p x-text="consentError"></p>
    </div>
</div>
