<?php
defined('ABSPATH') || exit;

$text_color = $data['colors']['text'] ?? '#111111';
$label_color = $data['colors']['label'] ?? '#666666';
$billing_address = $data['billing_address'] ?? [];
$shipping_address = $data['shipping_address'] ?? [];

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
    <td style="padding: 48px 0 0 0; border-top: 1px solid #E6E6E6; width: 100%;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td style="padding-right: 12px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.text" style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: <?php echo esc_attr($text_color); ?>;">
                        <?php echo esc_html__('Order number', 'kirki-ecommerce'); ?>
                    </p>
                    <p data-email-part="colors.label" style="margin: 0; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($label_color); ?>;">
                        <?php echo esc_html($data['order_number'] ?? ''); ?>
                    </p>
                </td>
                <td style="padding-left: 12px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.text" style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: <?php echo esc_attr($text_color); ?>;">
                        <?php echo esc_html__('Order date', 'kirki-ecommerce'); ?>
                    </p>
                    <p data-email-part="colors.label" style="margin: 0; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($label_color); ?>;">
                        <?php echo esc_html($data['order_date_display'] ?? ''); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding-top: 24px; padding-right: 12px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.text" style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: <?php echo esc_attr($text_color); ?>;">
                        <?php echo esc_html__('Shipping method', 'kirki-ecommerce'); ?>
                    </p>
                    <p data-email-part="colors.label" style="margin: 0; font-size: 13px; color: <?php echo esc_attr($label_color); ?>;">
                        <?php echo esc_html($data['shipping_method_name'] ?? ''); ?>
                    </p>
                </td>
                <td style="padding-left: 12px; padding-top: 24px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.text" style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: <?php echo esc_attr($text_color); ?>;">
                        <?php echo esc_html__('Payment Method', 'kirki-ecommerce'); ?>
                    </p>
                    <p data-email-part="colors.label" style="margin: 0; font-size: 13px; color: <?php echo esc_attr($label_color); ?>;">
                        <?php echo esc_html($data['payment_provider_name'] ?? ''); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding-top: 24px; padding-right: 12px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.text" style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: <?php echo esc_attr($text_color); ?>;">
                        <?php echo esc_html__('Billing address', 'kirki-ecommerce'); ?>
                    </p>
                    <?php foreach ($format_address($billing_address) as $line) : ?>
                        <p data-email-part="colors.label" style="margin: 0; margin-bottom: 4px; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($label_color); ?>;">
                            <?php echo esc_html($line); ?>
                        </p>
                    <?php endforeach; ?>
                </td>
                <td style="padding-left: 12px; padding-top: 24px; width: 50%; vertical-align: top;">
                    <p data-email-part="colors.text" style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: <?php echo esc_attr($text_color); ?>;">
                        <?php echo esc_html__('Shipping address', 'kirki-ecommerce'); ?>
                    </p>
                    <?php foreach ($format_address($shipping_address) as $line) : ?>
                        <p data-email-part="colors.label" style="margin: 0; margin-bottom: 4px; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($label_color); ?>;">
                            <?php echo esc_html($line); ?>
                        </p>
                    <?php endforeach; ?>
                </td>
            </tr>
        </table>
    </td>
</tr>