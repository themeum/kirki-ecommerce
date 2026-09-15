<?php

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

if (empty($data['customer_notes'])) {
    return;
}

$headings_color = $data['colors']['typography']['headings'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_HEADINGS;
$muted_color = $data['colors']['typography']['muted'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_MUTED;
$divider_color = $data['colors']['background']['divider'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_DIVIDER;
?>
<tr>
    <td data-email-part="colors.background.divider" style="padding: 32px 0; border-top: 1px solid <?php echo esc_attr($divider_color); ?>; width: 100%;">
        <p data-email-part="colors.typography.headings" style="margin-bottom: 8px; font-size: 14px; font-weight: 700; color: <?php echo esc_attr($headings_color); ?>;">
            <?php echo esc_html__('Customer note', 'kirki-ecommerce'); ?>
        </p>
        <p data-email-part="colors.typography.muted" style="margin: 0; font-size: 14px; font-weight: 400; color: <?php echo esc_attr($muted_color); ?>;">
            <?php echo nl2br(esc_html($data['customer_notes'])); ?>
        </p>
    </td>
</tr>