<?php

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

defined('ABSPATH') || exit;

use function Kirki\Ecommerce\Framework\view_data;

$data = view_data();
$default_template = $data['default_template'] ?? [];
$colors = $default_template['colors'] ?? [];
$button_text_color = $colors['button']['text'] ?? EmailDefaultTemplate::BUTTON_COLOR_TEXT;
?>
<a
    href="<?php echo esc_url($data['link'] ?? '#'); ?>"
    data-email-part="colors.button.text"
    style="font-weight: 300; color: <?php echo esc_attr($button_text_color); ?>; text-decoration: none; text-align: center;">
    <?php echo esc_html($data['label'] ?? $data['link'] ?? ''); ?>
</a>