<?php
defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;
use Kirki\Ecommerce\App\Supports\HtmlStyle;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$data = view_data();
$default_template = $data['default_template'] ?? [];

$outer_area_color = $default_template['colors']['background']['outer_area'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_OUTER_AREA;
$email_body_color = $default_template['colors']['background']['email_body'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_EMAIL_BODY;
?>
<!DOCTYPE html>
<html lang="<?php echo esc_attr(get_locale()); ?>">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo esc_html(get_bloginfo('name')); ?></title>
    <?php HtmlStyle::print_style_block(HtmlStyle::richtext_styles()); ?>
</head>

<body style="margin: 0; padding: 0; background-color: <?php echo esc_attr($outer_area_color); ?>; font-family: -apple-system, BlinkMacSystemFont, inter;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-email-part="colors.background.outer_area">
        <tr>
            <td align="center" style="padding: 24px 12px;">
                <table
                    role="presentation"
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    data-email-part="colors.background.email_body"
                    style="max-width: 560px; padding: 24px 48px 48px 48px; background-color: <?php echo esc_attr($email_body_color); ?>; border-radius: 8px; overflow: hidden;">
                    <?php
                    include_view('emails.layouts.header', $data);
                    include_view('emails.layouts.heading', $data);
                    include_view('emails.layouts.body', $data);
                    include_view('emails.layouts.footer', $data);
                    ?>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>