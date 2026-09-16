<?php

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

defined('ABSPATH') || exit;

$colors = $data['colors'] ?? [];
$body_color = $colors['typography']['body'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_BODY;
$info_cads = $colors['background']['info_cads'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_INFO_CADS;
$info_text = $data['info_text'] ?? '';

?>

<?php if (!empty($info_text)) : ?>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td style="margin: 0;">
            <p data-email-part="colors.typography.body colors.background.info_cads" style="margin-top: 8px; margin-bottom: 12px; border-radius: 12px; padding: 12px; font-size: 13px; font-weight: 500; color: <?php echo esc_attr($body_color); ?>; background-color: <?php echo esc_attr($info_cads); ?>"><?php echo esc_html($info_text); ?></p>
        </td>
    </tr>
    </table>
<?php endif; ?>