<?php

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;


defined('ABSPATH') || exit;

$divider_color = $data['colors']['background']['divider'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_DIVIDER;
$additional_description = $data['additional_description'] ?? '';
$footer = $data['footer'] ?? '';
?>
<tr<?php echo empty($additional_description) ? ' style="display:none;"' : ''; ?>>
    <td data-email-part="additional_description" style="padding: 24px 0 24px 0;">
        <?php echo wp_kses_post($additional_description); ?>
    </td>
</tr>
<tr<?php echo empty($footer) ? ' style="display:none;"' : ''; ?>>
    <td data-email-part="footer colors.background.divider" style="padding: 32px 0 0 0; border-top: 1px solid <?php echo esc_attr($divider_color); ?>;">
        <?php echo wp_kses_post($footer); ?>
    </td>
</tr>