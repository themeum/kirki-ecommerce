<?php

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;

use function Kirki\Ecommerce\Framework\view_data;

defined('ABSPATH') || exit;

$data = view_data();
$variant = $data['variant'] ?? [];
$default_template = $data['default_template'] ?? [];

$body_color = $default_template['colors']['typography']['body'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_BODY;
$headings_color = $default_template['colors']['typography']['headings'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_HEADINGS;
$muted_color = $default_template['colors']['typography']['muted'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_MUTED;
$exceptions_color = $default_template['colors']['typography']['exceptions'] ?? EmailDefaultTemplate::TYPOGRAPHY_COLOR_EXCEPTIONS;
$divider_color = $default_template['colors']['background']['divider'] ?? EmailDefaultTemplate::BACKGROUND_COLOR_DIVIDER;

?>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td style="padding: 32px 0 0 0;">
            <p data-email-part="colors.typography.headings" style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: <?php echo esc_attr($headings_color); ?>;">
                <?php echo esc_html__('Products affected', 'kirki-ecommerce'); ?>
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="padding-bottom: 16px; vertical-align: top; width: 56px;">
                        <div style="width: 48px; height: 48px; border-radius: 8px; background-color: #F5F5F5;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none">
                                <path fill="#858b93" d="M15 18a5 5 0 1 1 10 0 5 5 0 0 1-10 0m5-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6" />
                                <path fill="#858b93"
                                    d="M27.246 7h-6.492c-2.2 0-3.916 0-5.29.112-1.396.114-2.53.35-3.55.868a9 9 0 0 0-3.934 3.934c-.52 1.02-.754 2.154-.868 3.55C7 16.84 7 18.552 7 20.754v6.492c0 1.892 0 3.424.072 4.69q.008.195.024.4l.006.062c.07.932.19 1.748.408 2.492q.182.628.47 1.196a9 9 0 0 0 3.934 3.934c1.02.52 2.154.754 3.55.868 1.374.112 3.088.112 5.29.112h6.492c2.2 0 3.916 0 5.29-.112 1.396-.114 2.53-.35 3.55-.868a9 9 0 0 0 3.934-3.934c.992-1.95.986-4.306.98-6.482l-.002-.684.002-1.674v-6.492c0-2.2 0-3.916-.112-5.29-.114-1.396-.35-2.53-.868-3.55a9 9 0 0 0-3.934-3.934c-1.02-.52-2.154-.754-3.55-.868C31.162 7 29.448 7 27.246 7M9.106 32.372l-.012-.14c-.082-1.256 1.206-2.5 2.158-3.418q.23-.22.424-.414c.504-.508.846-.738 1.152-.848a3 3 0 0 1 2.06 0c.304.11.646.34 1.15.848.51.514 1.112 1.234 1.968 2.26a2.66 2.66 0 0 0 3.96.146l6.006-6.222c.174-.18.356-.384.544-.594.69-.772 1.476-1.652 2.394-1.958a3 3 0 0 1 1.894 0c1.546.516 2.998 2.258 4.26 3.772.468.56.908 1.09 1.32 1.514.502.522.616.822.614 1.526-.006 1.74-.04 3.014-.15 4.01-.114 1.01-.306 1.724-.61 2.324a7 7 0 0 1-3.06 3.06c-.692.352-1.532.552-2.804.656C31.09 39 29.456 39 27.2 39h-6.4c-2.256 0-3.89 0-5.172-.106-1.274-.104-2.114-.304-2.806-.656a7 7 0 0 1-3.184-3.326c-.276-.642-.44-1.426-.532-2.54M39 25.08l-1.85-1.916a36 36 0 0 0-1.952-1.936c-.566-.496-1.116-.878-1.762-1.092a5 5 0 0 0-3.158 0c-.646.214-1.196.596-1.76 1.092-.55.48-1.176 1.13-1.954 1.936l-6.038 6.252a.66.66 0 0 1-.984-.036l-.03-.036c-.82-.982-1.476-1.77-2.054-2.354-.592-.596-1.18-1.06-1.884-1.318a5 5 0 0 0-3.434 0c-.704.26-1.29.72-1.884 1.32q-.656.675-1.256 1.4V20.8c0-2.256 0-3.89.106-5.172.104-1.274.304-2.114.656-2.806a7 7 0 0 1 3.06-3.06c.692-.352 1.532-.552 2.806-.656C16.91 9 18.544 9 20.8 9h6.4c2.256 0 3.89 0 5.172.106 1.274.104 2.114.304 2.806.656a7 7 0 0 1 3.06 3.06c.352.692.552 1.532.656 2.806C39 16.91 39 18.544 39 20.8z" />
                            </svg>
                        </div>
                    </td>
                    <td style="padding-left:14px; padding-bottom: 16px; vertical-align: top;">
                        <p data-email-part="colors.typography.body" style="margin: 0; font-size: 13px; font-weight: 500; color: <?php echo esc_attr($body_color); ?>;">
                            <?php
                            echo esc_html('sample product'); // @todo: add product name
                            ?>
                        </p>
                        <p data-email-part="colors.typography.headings" style="margin: 4px 0 0 0; font-size: 12px; font-weight: 400; color: <?php echo esc_attr($headings_color); ?>;">
                            <?php echo esc_html('Porcelain | Colorful | Smooth'); // @todo: add variant name 
                            ?>
                        </p>
                    </td>
                    <td style="padding-left: 16px; padding-bottom: 16px; vertical-align: top; text-align: right; white-space: nowrap;">
                        <p data-email-part="colors.typography.body" style="margin: 0; font-size: 13px; font-weight: 500; color: #D40000;">
                            <?php echo esc_html('2 left'); // @todo: add quantity 
                            ?>
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>