<?php
defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

$colors = $data['colors'] ?? [];
$exceptions_color = $colors['typography']['exceptions'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_LINK;
$headings_color = $colors['typography']['headings'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_HEADINGS;
$body_color = $colors['typography']['body'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_BODY;

$customer_name = $data['customer_name'] ?? '';
?>
<tr>
    <td style="padding-top: 32px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: <?php echo esc_attr($exceptions_color); ?>;" data-email-part="colors.typography.exceptions">
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
            data-email-part="colors.typography.headings"
            style="margin: 0 0 12px 0; font-size: 30px; font-weight: 600; color: <?php echo esc_attr($headings_color); ?>;">
            <?php esc_html_e('A note has been added to your order', 'kirki-ecommerce'); ?>
        </p>
        <p data-email-part="colors.typography.body" style="margin: 0 0 12px 0; font-size: 14px; color: <?php echo esc_attr($body_color); ?>;">
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
        <p data-email-part="colors.typography.body" style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: <?php echo esc_attr($body_color); ?>;">
            <?php esc_html_e("The following note has been added to your order:", 'kirki-ecommerce'); ?>
        </p>
    </td>
</tr>