<?php
defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

$default_template = $data['default_template'] ?? [];

$logo_url = $default_template['logo_url'] ?? '';
$height = $default_template['height'] ?? EmailDefaultTemplate::HEIGHT;
$height = $height . 'px';
$position = $default_template['position'] ?? EmailDefaultTemplate::POSITION;
$align_map = [
    'start' => 'left',
    'center' => 'center',
    'end' => 'right',
];
$align = $align_map[$position] ?? 'center';
$divider_color = $default_template['colors']['background']['divider'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_DIVIDER;
$headings_color = $default_template['colors']['typography']['headings'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_HEADINGS;
?>
<tr>
    <td
        data-email-part="position colors.background.divider"
        style="padding: 24px 0; text-align: <?php echo esc_attr($align); ?>; border-bottom: 1px solid <?php echo esc_attr($divider_color); ?>; width: 100%;">
        <?php if (!empty($logo_url)) : ?>
            <img
                src="<?php echo esc_url($logo_url); ?>"
                alt="<?php echo esc_attr(get_bloginfo('name')); ?>"
                data-email-part="logo"
                style="height: <?php echo esc_attr($height); ?>; width: auto; display: inline-block; border: 0;" />
        <?php else : ?>
            <span
                data-email-part="logo colors.typography.headings"
                style="font-size: 18px; font-weight: 700; color: <?php echo esc_attr($headings_color); ?>;">
                <?php echo esc_html(get_bloginfo('name')); ?>
            </span>
        <?php endif; ?>
    </td>
</tr>