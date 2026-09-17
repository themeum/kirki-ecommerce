<?php

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;
use Kirki\Ecommerce\App\Supports\HtmlStyle;


defined('ABSPATH') || exit;

$default_template = $data['default_template'] ?? [];

$divider_color = $default_template['colors']['background']['divider'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_DIVIDER;
$additional_description = $default_template['additional_description'] ?? '';
$footer = $default_template['footer'] ?? '';
?>
<tr <?php echo empty($additional_description) ? 'style="display:none;"' : ''; ?>>
    <td data-email-part="additional_description" style="padding: 24px 0 24px 0;">
        <?php HtmlStyle::print_style_block([':scope div' => HtmlStyle::richtext()]); ?>
        <?php echo wp_kses_post($additional_description); ?>
    </td>
</tr>
<tr <?php echo empty($footer) ? 'style="display:none;"' : ''; ?>>
    <td data-email-part="footer colors.background.divider" style="padding: 32px 0 0 0; border-top: 1px solid <?php echo esc_attr($divider_color); ?>;">
        <?php HtmlStyle::print_style_block([':scope div' => HtmlStyle::richtext()]); ?>
        <?php echo wp_kses_post($footer); ?>
    </td>
</tr>