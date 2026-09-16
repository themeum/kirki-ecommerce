<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\Settings\SendTestEmailRequest;
use Kirki\Ecommerce\App\Mails\EmailNotificationRegistry;
use Kirki\Ecommerce\App\Services\MailerService;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

class EmailTemplateController
{
    /** @var MailerService */
    protected $mailer_service;

    public function __construct(MailerService $mailer_service)
    {
        $this->mailer_service = $mailer_service;
    }

    public function preview(Request $request, string $type, string $group, string $key)
    {
        $mailer = EmailNotificationRegistry::resolve($type, $group, $key);

        if (!$mailer) {
            return response()->json([
                'message' => __('Unknown notification template.', 'kirki-ecommerce'),
            ], 404);
        }

        return response()->json([
            'data' => [
                'html' => $this->mailer_service->get_preview($mailer),
                'variables' => $mailer->get_variables(),
            ],
            'message' => __('Template preview rendered successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function send_test_mail(SendTestEmailRequest $request, string $type, string $group, string $key)
    {
        $mailer = EmailNotificationRegistry::resolve($type, $group, $key);

        if (!$mailer) {
            return response()->json([
                'message' => __('Unknown notification template.', 'kirki-ecommerce'),
            ], 404);
        }

        $to = user()->get_email();

        if (empty($to)) {
            return response()->json([
                'message' => __('Could not determine your account email address.', 'kirki-ecommerce'),
            ], 422);
        }

        $mailer->with_template_overrides($request->all())->with_content_overrides($request->all());

        $mail_error = '';

        add_action('wp_mail_failed', function ($error) use (&$mail_error) {
            $mail_error = $error->get_error_message();
        });

        $sent = $this->mailer_service->send($mailer, $to);

        if (!$sent) {
            return response()->json([
                'message' => $mail_error !== ''
                    ? sprintf(
                        /* translators: %s: underlying mail error message */
                        __('The test email could not be sent: %s', 'kirki-ecommerce'),
                        $mail_error
                    )
                    : __('The test email could not be sent.', 'kirki-ecommerce'),
            ], 500);
        }

        return response()->json([
            'message' => __('Test email sent successfully.', 'kirki-ecommerce'),
        ]);
    }
}
