<?php
defined('ABSPATH') || exit;

use function Kirki\Ecommerce\Framework\view_data;

$data = view_data();
$default_template = $data['default_template'] ?? [];
$colors = $default_template['colors'] ?? [];
$button_text_color = $colors['button']['text'] ?? '#ffffff';
$button_bg_color = $colors['button']['background'] ?? '#000000';
?>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td
            data-email-part="colors.button.background"
            style="background-color: <?php echo esc_attr($button_bg_color); ?>; border-radius: 8px; width: 100%;">
            <a
                href="<?php echo esc_url($data['link'] ?? '#'); ?>"
                data-email-part="colors.button.text"
                style="display: inline-block; width: 100%; padding-top: 8px; padding-bottom: 8px; font-size: 12px; font-weight: 300; color: <?php echo esc_attr($button_text_color); ?>; text-decoration: none; text-align: center;">
                <?php echo esc_html($data['label'] ?? ''); ?>
            </a>
        </td>
    </tr>
</table>