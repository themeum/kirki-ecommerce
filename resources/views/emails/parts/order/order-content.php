<?php
defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

$colors = $data['colors'] ?? [];
$exceptions_color = $colors['typography']['exceptions'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_LINK;
$headings_color = $colors['typography']['headings'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_HEADINGS;
$body_color = $colors['typography']['body'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_BODY;

$title = $data['title'] ?? '';
$main_content = $data['main_content'] ?? '';
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
    </td>
</tr>
<tr>
    <td>
        <p
            data-email-part="colors.typography.headings"
            style="margin: 0 0 8px 0; font-size: 30px; font-weight: 600; color: <?php echo esc_attr($headings_color); ?>;">
            <?php echo esc_html($title); ?>
        </p>
    </td>
</tr>
<tr>
    <td data-email-part="colors.typography.body" style="margin: 0; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($body_color); ?>;">
        <div style="margin: 0 0 12px 0;"> <?php echo wp_kses_post($main_content); ?></div>
    </td>
</tr>