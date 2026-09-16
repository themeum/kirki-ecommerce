<?php

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

use function Kirki\Ecommerce\Framework\view_data;

$data = view_data();
$order = $data['order'] ?? [];

if (empty($order['customer_notes'])) {
    return;
}

$default_template = $data['default_template'] ?? [];
$colors = $default_template['colors'] ?? [];
$headings_color = $colors['typography']['headings'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_HEADINGS;
$muted_color = $colors['typography']['muted'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_MUTED;
$divider_color = $colors['background']['divider'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_DIVIDER;
?>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
    <td data-email-part="colors.background.divider" style="padding: 32px 0; border-top: 1px solid <?php echo esc_attr($divider_color); ?>; width: 100%;">
        <p data-email-part="colors.typography.headings" style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: <?php echo esc_attr($headings_color); ?>;">
            <?php echo esc_html__('Customer note', 'kirki-ecommerce'); ?>
        </p>
        <p data-email-part="colors.typography.muted" style="margin: 0; font-size: 14px; font-weight: 400; color: <?php echo esc_attr($muted_color); ?>;">
            <?php echo nl2br(esc_html($order['customer_notes'])); ?>
        </p>
    </td>
</tr>
</table>