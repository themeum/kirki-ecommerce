<?php

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

use function Kirki\Ecommerce\Framework\view_data;

defined('ABSPATH') || exit;

$data = view_data();
$colors = $data['colors'] ?? [];
$body_color = $colors['typography']['body'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_BODY;
$muted_color = $colors['typography']['body'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_MUTED;
$info_cads = $colors['background']['info_cads'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_INFO_CADS;


?>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td style="margin: 0; background-color: <?php echo esc_attr($info_cads); ?>">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="border-radius: 8px 0 0 8px; border-left: 1px solid #0000000A; border-top: 1px solid #0000000A; border-bottom: 1px solid #0000000A; min-width: 160px; padding: 8px 16px; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($muted_color); ?>;"><?php echo esc_html__('Username', 'kirki-ecommerce') ?></td>
                    <td style="border-radius: 0 8px 8px 0; border: 1px solid #0000000A; width: 100%; padding: 8px 12px; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($body_color); ?>;"><?php echo esc_html($data['user_name'] ?? '') ?></td>
                </tr>
            </table>
        </td>
    </tr>
</table>