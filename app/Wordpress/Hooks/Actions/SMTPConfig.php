<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\Framework\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
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
            error_log(
                sprintf(
                    __('%s hook configured in a wrong way.', 'kirki-ecommerce'),
                    $this->get_name()
                )
            );
            return;
        }

        $mailer = $args[0];

        if (!$mailer instanceof PHPMailer) {
            error_log(__('Mailer is not instance of PHPMailer.', 'kirki-ecommerce'));
            return;
        }

        $config = Settings::get(OptionKeys::EMAIL_SETTINGS);
        $is_smtp = $config->get('mailer') === 'smtp';

        if ($is_smtp && empty($config->get('mail'))) {
            error_log(__('Mail settings are not configured', 'kirki-ecommerce'));
            return;
        }

        if ($is_smtp) {
            $mailer->isSMTP();
            $mailer->Host = $config->get('mail.host');
            $mailer->SMTPAuth = $config->get('mail.enable_authentication');
            $mailer->Port = $config->get('mail.port');
            $mailer->Username = $config->get('mail.username');
            $mailer->Password = $config->get('mail.password');
            $mailer->SMTPSecure = $config->get('mail.encryption');
            $mailer->FromName = $config->get('mail.from_name');
            $mailer->From = $config->get('mail.from_email');
        }
    }
}
