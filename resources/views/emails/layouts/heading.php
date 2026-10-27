<?php
defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

use function Kirki\Ecommerce\Framework\view_data;

$data = view_data();
$default_template = $data['default_template'] ?? [];
$colors = $default_template['colors'] ?? [];
$exceptions_color = $colors['typography']['exceptions'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_LINK;
$headings_color = $colors['typography']['headings'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_HEADINGS;

$heading = $data['heading'] ?? '';
?>
<?php if (!empty($data['order_number'])) : ?>
    <tr>
        <td style="padding-top: 32px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: <?php echo esc_attr($exceptions_color); ?>;" data-email-part="colors.typography.exceptions">
                <?php
                echo esc_html(
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
<?php endif; ?>
<tr>
    <td>
        <p
            data-email-part="colors.typography.headings heading"
            style="<?php echo empty($data['order_number']) ? esc_attr('padding-top: 32px;') : '' ?> margin: 0 0 8px 0; font-size: 30px; font-weight: 600; color: <?php echo esc_attr($headings_color); ?>;">
            <?php echo esc_html($heading); ?>
        </p>
    </td>
</tr>