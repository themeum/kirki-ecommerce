<?php
defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

$colors = $data['colors'] ?? [];
$body_color = $colors['typography']['body'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_BODY;
$main_content = $data['main_content'] ?? '';
?>
<tr>
    <td data-email-part="colors.typography.body" style="margin: 0; font-size: 13px; font-weight: 400; color: <?php echo esc_attr($body_color); ?>;">
        <div style="margin: 0 0 12px 0;"> <?php echo wp_kses_post($main_content); ?></div>
    </td>
</tr>