<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentGateway;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;

defined('ABSPATH') || exit;
class Authorizenet extends PaymentGateway
{
    private const FORM_URL_SANDBOX = 'https://test.authorize.net/payment/payment';
    private const FORM_URL_PRODUCTION = 'https://accept.authorize.net/payment/payment';
    private const RESULT_CODE_ERROR = 'Error';
    private const WEBHOOK_CAPTURE_CREATED = 'net.authorize.payment.authcapture.created';

    private ?AuthorizenetClient $client = null;
    private AuthorizenetTransactionBuilder $transaction_builder;

    public function __construct()
    {
        $this->transaction_builder = new AuthorizenetTransactionBuilder();

        $this->id = 'authorizenet';
        $this->title = __('AuthorizeNet', 'kirki-ecommerce');
        $this->description = __('AuthorizeNet payment gateway', 'kirki-ecommerce');
        $this->icon = 'authorizenet';
        $this->settings_key = 'authorizenet';
        $this->is_manual = false;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'login_id',
                'label' => __('Login ID', 'kirki-ecommerce'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'transaction_key',
                'label' => __('Transaction key', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'signature_key',
                'label' => __('Signature key', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * Pay for an order.
     *
     * Unlike Stripe/PayPal, this does not return a bare redirect URL — AuthorizeNet's
     * Accept Hosted page requires the token via POST, so this returns a self-submitting
     * HTML form. Callers must render it directly rather than redirecting to it.
     *
     * @param Order $order
     * @return string HTML markup.
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('AuthorizeNet is not enabled.', 'kirki-ecommerce'));
        }

        $this->get_client();

        if (!in_array($order->currency_code, $this->client->supported_currencies(), true)) {
            throw new Exception(__('Currency is not supported.', 'kirki-ecommerce'));
        }

        try {
            $response = $this->client->send([
                'getHostedPaymentPageRequest' => [
                    'merchantAuthentication' => $this->client->authentication(),
                    'refId' => $order->id,
                    'transactionRequest' => $this->transaction_builder->build_transaction_request($order),
                    'hostedPaymentSettings' => $this->transaction_builder->build_hosted_payment_settings($this->return_url($order)),
                ],
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('AuthorizeNet Payment Error: %s', 'kirki-ecommerce'), $e->getMessage()));
        }

        $result_code = $response->messages->resultCode;

        if (static::RESULT_CODE_ERROR === $result_code) {
            throw new Exception(sprintf(__('AuthorizeNet Payment Error: %s', 'kirki-ecommerce'), $response->messages->message));
        }

        if (empty($response->token)) {
            throw new Exception(__('AuthorizeNet did not return a payment token.', 'kirki-ecommerce'));
        }

        $form_url = $this->client->is_sandbox() ? static::FORM_URL_SANDBOX : static::FORM_URL_PRODUCTION;
        return $this->render_redirect_form($form_url, $response->token);
    }

    /**
     * Build an auto-submitting form that POSTs the payment token to
     * AuthorizeNet's hosted payment page.
     *
     * AuthorizeNet's Accept Hosted flow requires the token to arrive via
     * POST — a plain redirect URL is not sufficient, unlike Stripe/PayPal.
     */
    private function render_redirect_form(string $form_url, string $token): string
    {
        ob_start();
?>
        <form method="POST" id="authorizenet-form" action="<?php echo esc_url($form_url); ?>">
            <input type="hidden" name="token" value="<?php echo esc_attr($token); ?>" />
        </form>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const form = document.getElementById('authorizenet-form');
                form.submit();
            })
        </script>
<?php
        return ob_get_clean();
    }

    private function get_client(): AuthorizenetClient
    {
        if ($this->client) {
            return $this->client;
        }

        $login_id = $this->settings['login_id'] ?? '';
        $transaction_key = $this->settings['transaction_key'] ?? '';
        $signature_key = $this->settings['signature_key'] ?? '';

        if (empty($login_id) || empty($transaction_key) || empty($signature_key)) {
            throw new Exception(__('AuthorizeNet credentials are missing.', 'kirki-ecommerce'));
        }

        $is_sandbox = (bool) ($this->settings['sandbox'] ?? false);
        return $this->client = new AuthorizenetClient($login_id, $transaction_key, $signature_key, $is_sandbox);
    }

    /**
     * Validate settings.
     *
     * @param array $settings
     * @return bool
     */
    protected function validate_settings(array $settings)
    {
        parent::validate_settings($settings);

        Validator::make($settings, [
            'login_id' => 'required|string',
            'transaction_key' => 'required|string',
            'signature_key' => 'required|string',
            'sandbox' => 'boolean',
        ])->validate();

        return true;
    }

    /**
     * Sanitize settings.
     *
     * @param array $settings
     * @return array
     */
    protected function sanitize_settings(array $settings)
    {
        $parent_settings = parent::sanitize_settings($settings);

        $data = Sanitizer::make($settings, [
            'login_id' => Sanitizer::TEXT,
            'transaction_key' => Sanitizer::TEXT,
            'signature_key' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    public function webhook()
    {
        $event = $this->verify_and_parse_notification();

        if (static::WEBHOOK_CAPTURE_CREATED !== $event->eventType) {
            return false;
        }

        $order_id = $event->payload->merchantReferenceId;
        $transaction = $this->fetch_transaction($order_id, $event->payload->id);

        $this->handle_transaction_response($order_id, $transaction);
        return true;
    }

    protected function verify_and_parse_notification()
    {
        $payload = @file_get_contents('php://input');

        // Respond with a 200 status code to acknowledge the notification.
        http_response_code(200);

        if (empty($payload)) {
            throw new Exception(__('Invalid Payload From AuthorizeNet.', 'kirki-ecommerce'));
        }

        $this->get_client();

        if (!$this->client->is_verified($payload)) {
            throw new Exception(__('Webhook Notification Is Not Valid.', 'kirki-ecommerce'));
        }

        return json_decode($payload);
    }

    protected function fetch_transaction(string $order_id, string $transaction_id): object
    {
        try {
            $response = $this->client->send([
                'getTransactionDetailsRequest' => [
                    'merchantAuthentication' => $this->client->authentication(),
                    'refId' => $order_id,
                    'transId' => $transaction_id,
                ],
            ]);
        } catch (\Throwable $e) {
            throw new Exception(
                sprintf(__('Authorize.Net API error: %s', 'kirki-ecommerce'), $e->getMessage()),
            );
        }

        if (static::RESULT_CODE_ERROR === $response->messages->resultCode) {
            $text = $response->messages->message[0]->text
                ?? __('Unknown error', 'kirki-ecommerce');

            throw new Exception(
                sprintf(__('Authorize.Net API error: %s', 'kirki-ecommerce'), $text)
            );
        }

        return $response;
    }

    protected function handle_transaction_response(string $order_id, object $response): void
    {
        $status = $this->transaction_builder->get_transaction_status($response->transaction);

        DB::begin_transaction();

        try {
            OrderManager::set_transaction_id($order_id, $response->transaction->transId);

            switch ($status) {
                case AuthorizenetTransactionBuilder::PAID:
                    OrderManager::set_transaction_id($order_id, $response->transaction->transId);
                    OrderManager::mark_payment_as_paid($order_id);
                    OrderManager::mark_as_processing($order_id);
                    OrderManager::set_payment_metadata($order_id, wp_json_encode($response));
                    break;
                case AuthorizenetTransactionBuilder::PENDING:
                    OrderManager::mark_payment_as_pending($order_id);
                    OrderManager::mark_as_on_hold($order_id);
                    break;
                case AuthorizenetTransactionBuilder::CANCELED:
                case AuthorizenetTransactionBuilder::FAILED:
                    OrderManager::set_transaction_id($order_id, $response->transaction->transId);
                    OrderManager::mark_payment_as_failed($order_id);
                    OrderManager::mark_as_cancelled($order_id);
                    OrderManager::set_payment_metadata($order_id, wp_json_encode($response));
                default:
                    OrderManager::mark_as_pending($order_id);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(sprintf(__('Failed to update order data: %s', 'kirki-ecommerce'), $e->getMessage()));
        }
    }
}
