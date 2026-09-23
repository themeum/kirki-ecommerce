<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\Settings\SendTestEmailRequest;
use Kirki\Ecommerce\App\Services\EmailPreviewService;
use Kirki\Ecommerce\App\Services\MailerService;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

/**
 * REST controller for previewing and test-sending email notification templates.
 *
 * @since 1.0.0
 */
class EmailTemplateController
{
    /** @var MailerService */
    protected $mailer_service;

    /** @var EmailPreviewService */
    protected $email_preview_service;

    /**
     * Create the controller with its mailer and preview services.
     *
     * @since 1.0.0
     *
     * @param MailerService       $mailer_service
     * @param EmailPreviewService $email_preview_service
     */
    public function __construct(MailerService $mailer_service, EmailPreviewService $email_preview_service)
    {
        $this->mailer_service = $mailer_service;
        $this->email_preview_service = $email_preview_service;
    }

    /**
     * Render the HTML preview and available variables of a notification template.
     *
     * @since 1.0.0
     *
     * @param Request $_request
     * @param string  $type     Notification type.
     * @param string  $group    Template group within the type.
     * @param string  $key      Template key within the group.
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The preview HTML and variables, or a 404 response for an unknown template.
     */
    public function preview(Request $_request, string $type, string $group, string $key)
    {
        $mailer = $this->email_preview_service->resolve_mailer($type, $group, $key);

        if (!$mailer) {
            return response()->json([
                'message' => __('Unknown notification template.', 'kirki-ecommerce'),
            ], Response::NOT_FOUND);
        }

        return response()->json([
            'data' => [
                'html' => $this->mailer_service->get_preview($mailer),
                'variables' => $mailer->get_variables(),
            ],
            'message' => __('Template preview rendered successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Send a test email of a notification template to the current user.
     *
     * The request body overrides the template and email settings for this send only.
     *
     * @since 1.0.0
     *
     * @param SendTestEmailRequest $request
     * @param string               $type    Notification type.
     * @param string               $group   Template group within the type.
     * @param string               $key     Template key within the group.
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse A success message; a 404 response for an unknown template, 422 when the user has no email address, or 500 when sending fails.
     */
    public function send_test_mail(SendTestEmailRequest $request, string $type, string $group, string $key)
    {
        $mailer = $this->email_preview_service->resolve_mailer($type, $group, $key);

        if (!$mailer) {
            return response()->json([
                'message' => __('Unknown notification template.', 'kirki-ecommerce'),
            ], Response::NOT_FOUND);
        }

        $to = user()->get_email();

        if (empty($to)) {
            return response()->json([
                'message' => __('Could not determine your account email address.', 'kirki-ecommerce'),
            ], Response::UNPROCESSABLE_ENTITY);
        }

        $mailer->with_default_template_settings_overrides($request->all())->with_email_settings_overrides($request->all());

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
            ], Response::INTERNAL_SERVER_ERROR);
        }

        return response()->json([
            'message' => __('Test email sent successfully.', 'kirki-ecommerce'),
        ]);
    }
}
