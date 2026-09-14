<?php
defined('ABSPATH') || exit;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\render_section;
use function Kirki\Ecommerce\Framework\template_engine;

$shared = template_engine()->get_shared();

$data = $shared['data'] ?? [];

$background_color = $data['colors']['background'] ?? 'inherit';
?>
<!DOCTYPE html>
<html lang="<?php echo esc_attr(get_locale()); ?>">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo esc_html(get_bloginfo('name')); ?></title>
</head>

<body style="margin: 0; padding: 0; background-color: #DBDBE5; font-family: -apple-system, BlinkMacSystemFont, inter;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 24px 12px;">
                <table
                    role="presentation"
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    data-email-part="colors.background"
                    style="max-width: 560px; padding: 24px 48px 48px 48px; background-color: <?php echo esc_attr($background_color); ?>; border-radius: 8px; overflow: hidden;">
                    <?php
                    include_view('emails.layouts.header', $data);
                    render_section('email-content');
                    include_view('emails.layouts.footer', $data);
                    ?>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>