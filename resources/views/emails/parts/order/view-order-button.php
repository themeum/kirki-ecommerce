<?php
defined('ABSPATH') || exit;

$colors = $data['colors'] ?? [];
$button_color = $colors['button'] ?? '#ffffff';
$button_bg = $colors['button_bg'] ?? '#000000';
?>
<tr>
    <td
        data-email-part="colors.button_bg"
        style="background-color: <?php echo esc_attr($button_bg); ?>; border-radius: 8px; width: 100%;">
        <a
            href="<?php echo esc_url($data['order_view_url'] ?? '#'); ?>"
            data-email-part="colors.button"
            style="display: inline-block; width: 100%; padding-top: 8px; padding-bottom: 8px; font-size: 12px; font-weight: 300; color: <?php echo esc_attr($button_color); ?>; text-decoration: none; text-align: center;">
            <?php esc_html_e('View Your Order', 'kirki-ecommerce'); ?>
        </a>
    </td>
</tr>