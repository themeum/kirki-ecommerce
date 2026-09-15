<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\Framework\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\App\Constants\MailEncryption;
use Kirki\Ecommerce\App\Constants\Mailer;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use PHPMailer\PHPMailer\PHPMailer;

class SMTPConfig extends BaseHook
{
    public function get_name(): string
    {
        return HookNames::WP_PHP_MAILER_INIT;
    }

    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        if (empty($args)) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Genuine misconfiguration error, not debug output; writes to the server's PHP error log rather than this plugin's own framework.log, which is not protected from direct web access.
            error_log(
                sprintf(
                    /* translators: %s: hook name */
                    __('%s hook configured in a wrong way.', 'kirki-ecommerce'),
                    $this->get_name()
                )
            );
            return;
        }

        $mailer = $args[0];

        if (!$mailer instanceof PHPMailer) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Genuine misconfiguration error, not debug output; writes to the server's PHP error log rather than this plugin's own framework.log, which is not protected from direct web access.
            error_log(__('Mailer is not instance of PHPMailer.', 'kirki-ecommerce'));
            return;
        }

        $config = Settings::get(OptionKeys::EMAIL_SETTINGS);
        $is_smtp = $config->get('mail_configuration.mailer') === Mailer::SMTP;

        if ($is_smtp) {
            if (empty($config->get('mail_configuration.host'))) {
                // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Genuine misconfiguration error, not debug output; writes to the server's PHP error log rather than this plugin's own framework.log, which is not protected from direct web access.
                error_log(__('Mail settings are not configured', 'kirki-ecommerce'));
                return;
            }


            $mailer->isSMTP();
            $mailer->Host = $config->get('mail_configuration.host');
            $mailer->Port = (int) $config->get('mail_configuration.port');
            $mailer->From = $config->get('mail_configuration.from_email') ?? get_bloginfo('admin_email');
            $mailer->FromName = $config->get('mail_configuration.from_name') ?? get_bloginfo('name');

            $is_authentication_enabled = (bool) $config->get('mail_configuration.is_authentication_enabled');
            $mailer->SMTPAuth = $is_authentication_enabled;

            if ($is_authentication_enabled) {
                $mailer->Username = $config->get('mail_configuration.username');
                $mailer->Password = $config->get('mail_configuration.password');
            }

            $encryption = $config->get('mail_configuration.encryption');
            $mailer->SMTPSecure = $encryption === MailEncryption::NONE ? '' : (string) $encryption;
        }
    }
}
