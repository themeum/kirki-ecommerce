<?php
defined('ABSPATH') || exit;

$colors = $data['colors'] ?? [];
$link_color = $colors['link'] ?? '#2563eb';
$text_color = $colors['text'] ?? '#111111';
$button_color = $colors['button'] ?? '#ffffff';
$button_bg = $colors['button_bg'] ?? '#000000';

$customer_name = $data['customer_name'] ?? '';
?>
<tr>
    <td style="padding-top: 48px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: <?php echo esc_attr($link_color); ?>;" data-email-part="colors.link">
            <?php
            esc_html_e(
                sprintf(
                    /* translators: %s: order number */
                    __('Order %s', 'kirki-ecommerce'),
                    $data['order_number'] ?? ''
                )
            );
            ?>
        </p>
        <p
            data-email-part="colors.text"
            style="margin: 0 0 12px 0; font-size: 30px; font-weight: 600; color: <?php echo esc_attr($text_color); ?>;">
            <?php esc_html_e('A note has been added to your order', 'kirki-ecommerce'); ?>
        </p>
        <p data-email-part="colors.text" style="margin: 0 0 12px 0; font-size: 14px; color: <?php echo esc_attr($text_color); ?>;">
            <?php
            echo esc_html(
                sprintf(
                    /* translators: %s: customer name */
                    __('Hi %s,', 'kirki-ecommerce'),
                    $customer_name
                )
            );
            ?>
        </p>
        <p data-email-part="colors.text" style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: <?php echo esc_attr($text_color); ?>;">
            <?php esc_html_e("The following note has been added to your order:", 'kirki-ecommerce'); ?>
        </p>
    </td>
</tr>
