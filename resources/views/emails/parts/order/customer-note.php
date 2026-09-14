<?php

defined('ABSPATH') || exit;

if (empty($data['customer_notes'])) {
    return;
}

$text_color = $data['colors']['text'] ?? '#111111';
$label_color = $data['colors']['label'] ?? '#666666';
?>
<tr>
    <td style="padding: 48px 0; border-top: 1px solid #E6E6E6; width: 100%;">
        <p data-email-part="colors.text" style="margin-bottom: 8px; font-size: 14px; font-weight: 700; color: <?php echo esc_attr($text_color); ?>;">
            <?php echo esc_html__('Customer note', 'kirki-ecommerce'); ?>
        </p>
        <p data-email-part="colors.label" style="margin: 0; font-size: 14px; font-weight: 400; color: <?php echo esc_attr($label_color); ?>;">
            <?php echo nl2br(esc_html($data['customer_notes'])); ?>
        </p>
    </td>
</tr>