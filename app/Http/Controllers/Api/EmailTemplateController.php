<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\Settings\SendTestEmailRequest;
use Kirki\Ecommerce\App\Mails\customers\CustomerOrderConfirmationMail;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Services\MailerService;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\json_decoded_data;
use function Kirki\Ecommerce\Framework\resource_path;
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

    public function preview(Request $request)
    {
        return response()->json([
            'data' => ['html' => $this->mailer_service->get_preview(CustomerOrderConfirmationMail::make($this->build_sample_order()))],
            'message' => __('Template preview rendered successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function send_test_mail(SendTestEmailRequest $request)
    {
        $to = user()->get_email();

        if (empty($to)) {
            return response()->json([
                'message' => __('Could not determine your account email address.', 'kirki-ecommerce'),
            ], 422);
        }

        $mail = CustomerOrderConfirmationMail::make($this->build_sample_order())->with_template_overrides($request->all());

        $mail_error = '';

        add_action('wp_mail_failed', function ($error) use (&$mail_error) {
            $mail_error = $error->get_error_message();
        });

        $sent = $this->mailer_service->send($mail, $to);

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

    /**
     * Build an in-memory sample order (never persisted) so the preview and
     * test-email endpoints don't depend on a real order existing.
     *
     * @return Order
     */
    protected function build_sample_order()
    {
        $order_data = json_decoded_data(resource_path('data/sample/order.json')) ?? [];
        $items_data = json_decoded_data(resource_path('data/sample/order-items.json')) ?? [];

        $order = new Order($order_data);
        $order->created_at = $order_data['paid_at'] ?? gmdate('Y-m-d H:i:s');

        $items = collection($items_data)->map(function ($item) {
            return new OrderItem($item);
        });

        $order->set_relation('items', $items);
        $order->set_relation('refunds', collection());

        return $order;
    }
}
