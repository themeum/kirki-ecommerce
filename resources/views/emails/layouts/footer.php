<?php

use function Kirki\Ecommerce\Framework\view_data;

defined('ABSPATH') || exit;


$label_color = $data['colors']['label'] ?? '#666666';
$link_color = $data['colors']['link'] ?? '#2563eb';
$support_email = $data['support_email'] ?? '';
?>
<tr>
    <td style="padding: 48px 0;">
        <?php if (!empty($support_email)) : ?>
            <p data-email-part="colors.label" style="font-size: 14px; font-weight: 400; color: <?php echo esc_attr($label_color); ?>;">
                <?php echo esc_html__('If you have any questions, reply to this email or contact us at', 'kirki-ecommerce'); ?>
                <a href="mailto:<?php echo esc_attr($support_email); ?>" data-email-part="colors.link" style="color: <?php echo esc_attr($link_color); ?>; text-decoration: none;">
                    <?php echo esc_html($support_email); ?>
                </a>.
            </p>
        <?php endif; ?>
        <?php if (!empty($data['signature_message'])) : ?>
            <p data-email-part="colors.label" style="margin: 8px 0 0 0; font-size: 14px; font-weight: 400; color: <?php echo esc_attr($label_color); ?>;">
                <?php echo esc_html($data['signature_message']); ?>
            </p>
        <?php endif; ?>
        <?php if (!empty($data['signature_name'])) : ?>
            <p data-email-part="colors.label" style="margin: 2px 0 0 0;  font-size: 14px; font-weight: 400; color: <?php echo esc_attr($label_color); ?>;">
                <?php echo esc_html($data['signature_name']); ?>
            </p>
        <?php endif; ?>

    </td>
</tr>
<tr>
    <td style="padding: 48px 0 0 0; border-top: 1px solid #E6E6E6;">
        <?php if (!empty($data['store_name']) || !empty($data['store_address'])) : ?>
            <p data-email-part="colors.label" style="font-size: 12px; font-weight: 400; color: <?php echo esc_attr($label_color); ?>; text-align: center;">
                <?php
                echo esc_html(
                    trim(($data['store_name'] ?? '') . ' · ' . ($data['store_address'] ?? ''), ' ·')
                );
                ?>
            </p>
        <?php endif; ?>
    </td>
</tr>