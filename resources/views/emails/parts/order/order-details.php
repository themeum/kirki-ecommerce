<?php
defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

use function Kirki\Ecommerce\Framework\view_data;

$data = view_data();
$order = $data['order'] ?? [];
$default_template = $data['default_template'] ?? [];
$colors = $default_template['colors'] ?? [];

$headings_color = $colors['typography']['headings'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_HEADINGS;
$muted_color = $colors['typography']['muted'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_MUTED;
$divider_color = $colors['background']['divider'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_DIVIDER;
$billing_address = $order['billing_address'] ?? [];
$shipping_address = $order['shipping_address'] ?? [];

$order_date = $order['created_at'] ?? null;
$order_date_display = $order_date instanceof DateTimeInterface ? $order_date->format('F j, Y') : (string) $order_date;

$format_address = function (array $address) {
    $lines = array_filter([
        trim(($address['first_name'] ?? '') . ' ' . ($address['last_name'] ?? '')),
        $address['company'] ?? '',
        $address['address_line1'] ?? '',
        $address['address_line2'] ?? '',
        trim(($address['city'] ?? '') . ', ' . ($address['state'] ?? '') . ' ' . ($address['postal_code'] ?? '')),
        $address['country'] ?? '',
        $address['phone'] ?? '',
        $address['email'] ?? '',
    ]);

    return $lines;
};
?>
<tr>
    <td data-email-part="colors.background.divider" style="padding: 32px 0 0 0; border-top: 1px solid <?php echo esc_attr($divider_color); ?>; width: 100%;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td style="padding-right: 12px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.typography.headings" style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: <?php echo esc_attr($headings_color); ?>;">
                        <?php echo esc_html__('Order number', 'kirki-ecommerce'); ?>
                    </p>
                    <p data-email-part="colors.typography.muted" style="margin: 0; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($muted_color); ?>;">
                        <?php echo esc_html($order['order_number'] ?? ''); ?>
                    </p>
                </td>
                <td style="padding-left: 12px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.typography.headings" style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: <?php echo esc_attr($headings_color); ?>;">
                        <?php echo esc_html__('Order date', 'kirki-ecommerce'); ?>
                    </p>
                    <p data-email-part="colors.typography.muted" style="margin: 0; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($muted_color); ?>;">
                        <?php echo esc_html($order_date_display); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding-top: 24px; padding-right: 12px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.typography.headings" style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: <?php echo esc_attr($headings_color); ?>;">
                        <?php echo esc_html__('Shipping method', 'kirki-ecommerce'); ?>
                    </p>
                    <p data-email-part="colors.typography.muted" style="margin: 0; font-size: 13px; color: <?php echo esc_attr($muted_color); ?>;">
                        <?php echo esc_html($order['shipping_method_name'] ?? ''); ?>
                    </p>
                </td>
                <td style="padding-left: 12px; padding-top: 24px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.typography.headings" style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: <?php echo esc_attr($headings_color); ?>;">
                        <?php echo esc_html__('Payment Method', 'kirki-ecommerce'); ?>
                    </p>
                    <p data-email-part="colors.typography.muted" style="margin: 0; font-size: 13px; color: <?php echo esc_attr($muted_color); ?>;">
                        <?php echo esc_html($order['payment_provider_name'] ?? ''); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding-top: 24px; padding-right: 12px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.typography.headings" style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: <?php echo esc_attr($headings_color); ?>;">
                        <?php echo esc_html__('Billing address', 'kirki-ecommerce'); ?>
                    </p>
                    <?php foreach ($format_address($billing_address) as $line) : ?>
                        <p data-email-part="colors.typography.muted" style="margin: 0; margin-bottom: 4px; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($muted_color); ?>;">
                            <?php echo esc_html($line); ?>
                        </p>
                    <?php endforeach; ?>
                </td>
                <td style="padding-left: 12px; padding-top: 24px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.typography.headings" style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: <?php echo esc_attr($headings_color); ?>;">
                        <?php echo esc_html__('Shipping address', 'kirki-ecommerce'); ?>
                    </p>
                    <?php foreach ($format_address($shipping_address) as $line) : ?>
                        <p data-email-part="colors.typography.muted" style="margin: 0; margin-bottom: 4px; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($muted_color); ?>;">
                            <?php echo esc_html($line); ?>
                        </p>
                    <?php endforeach; ?>
                </td>
            </tr>
        </table>
    </td>
</tr>