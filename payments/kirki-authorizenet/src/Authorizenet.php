<?php
namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;

defined('ABSPATH') || exit;

/**
 * Authorize.Net payment gateway.
 */
class Authorizenet extends PaymentProvider
{
    protected ?AuthorizenetClient $client = null;
    protected AuthorizenetTransactionBuilder $transaction_builder;

    public function __construct()
    {
        $this->id = 'authorizenet';
        $this->title = __('AuthorizeNet', 'kirki-ecommerce-authorizenet');
        $this->description = __('AuthorizeNet payment gateway', 'kirki-ecommerce-authorizenet');
        $this->icon = 'authorizenet';
        $this->settings_key = 'authorizenet';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;
        $this->transaction_builder = new AuthorizenetTransactionBuilder();

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'login_id',
                'label' => __('Login ID', 'kirki-ecommerce-authorizenet'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'transaction_key',
                'label' => __('Transaction key', 'kirki-ecommerce-authorizenet'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'signature_key',
                'label' => __('Signature key', 'kirki-ecommerce-authorizenet'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-authorizenet'),
                'type' => 'checkbox',
            ],
        ]);

        $this->client = $this->get_client();
    }

    /**
     * Pay for an order.
     *
     * @param Order $order
     * @return string HTML markup.
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('AuthorizeNet is not enabled.', 'kirki-ecommerce-authorizenet'));
        }

        if (!in_array($order->currency_code, $this->client->supported_currencies(), true)) {
            throw new Exception(__('Currency is not supported.', 'kirki-ecommerce-authorizenet'));
        }

        try {
            $response = $this->client->send([
                'getHostedPaymentPageRequest' => [
                    'merchantAuthentication' => $this->client->authentication(),
                    'refId' => $order->id,
                    'transactionRequest' => $this->transaction_builder->build_transaction_request($order),
                    'hostedPaymentSettings' => $this->transaction_builder->build_hosted_payment_settings(
                        ['success_url' => Url::get_checkout_success_url($order->uuid), 'cancel_url' => Url::get_checkout_failed_url($order->uuid)]
                    ),
                ],
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('AuthorizeNet Payment Error: %s', 'kirki-ecommerce-authorizenet'), $e->getMessage()));
        }

        $result_code = $response->messages->resultCode;

        if (AuthorizenetConstant::RESULT_CODE_ERROR === $result_code) {
            throw new Exception(
                sprintf(__('AuthorizeNet Payment Error: %s', 'kirki-ecommerce-authorizenet'), $response->messages->message)
            );
        }

        if (empty($response->token)) {
            throw new Exception(__('AuthorizeNet did not return a payment token.', 'kirki-ecommerce-authorizenet'));
        }

        return $this->render_redirect_form($response->token);
    }

    /**
     * Build an auto-submitting form that POSTs the payment token to
     * AuthorizeNet's hosted payment page.
     */
    protected function render_redirect_form(string $token): string
    {
        $form_url = $this->client->is_sandbox()
            ? AuthorizenetConstant::FORM_URL_SANDBOX
            : AuthorizenetConstant::FORM_URL_PRODUCTION;
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

    /**
     * Get the Authorize.Net API client.
     *
     * @return AuthorizenetClient
     * @throws Exception If the gateway credentials are missing.
     */
    protected function get_client(): AuthorizenetClient
    {
        if ($this->client) {
            return $this->client;
        }

        $login_id = $this->settings['login_id'] ?? '';
        $transaction_key = $this->settings['transaction_key'] ?? '';
        $signature_key = $this->settings['signature_key'] ?? '';

        if (empty($login_id) || empty($transaction_key) || empty($signature_key)) {
            throw new Exception(__('AuthorizeNet credentials are missing.', 'kirki-ecommerce-authorizenet'));
        }

        $is_sandbox = (bool) ($this->settings['sandbox'] ?? false);
        return new AuthorizenetClient($login_id, $transaction_key, $signature_key, $is_sandbox);
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

    /**
     * Handle an Authorize.Net webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the API lookup fails.
     */
    public function webhook()
    {
        $event = $this->verify_and_parse_notification();

        $allowed_event_types = [
            AuthorizenetConstant::WEBHOOK_CAPTURE_CREATED,
            AuthorizenetConstant::WEBHOOK_VOID_CREATED
        ];

        if (!in_array($event->eventType, $allowed_event_types, true)) {
            return false;
        }

        $order_id = $event->payload->merchantReferenceId;
        $transaction = $this->fetch_transaction($order_id, $event->payload->id);

        $this->handle_transaction_response($order_id, $transaction);
        return true;
    }

    /**
     * Read the raw webhook payload, verify its signature, and decode it.
     *
     * @return object The decoded webhook payload.
     * @throws Exception If the payload is empty or its signature is invalid.
     */
    protected function verify_and_parse_notification()
    {
        $payload = @file_get_contents('php://input');

        // Respond with a 200 status code to acknowledge the notification.
        http_response_code(200);

        if (empty($payload)) {
            throw new Exception(__('Invalid Payload From AuthorizeNet.', 'kirki-ecommerce-authorizenet'));
        }

        if (!$this->client->is_verified($payload)) {
            throw new Exception(__('Webhook Notification Is Not Valid.', 'kirki-ecommerce-authorizenet'));
        }

        return json_decode($payload);
    }

    /**
     * Fetch full transaction details for a webhook notification from Authorize.Net.
     *
     * @param string $order_id The order reference ID (refId).
     * @param string $transaction_id The Authorize.Net transaction ID.
     * @return object The transaction details response.
     * @throws Exception If the API request fails or returns an error.
     */
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
                sprintf(__('Authorize.Net API error: %s', 'kirki-ecommerce-authorizenet'), $e->getMessage()),
            );
        }

        if (AuthorizenetConstant::RESULT_CODE_ERROR === $response->messages->resultCode) {
            $text = $response->messages->message ?? __('Unknown error', 'kirki-ecommerce-authorizenet');

            throw new Exception(
                sprintf(__('Authorize.Net API error: %s', 'kirki-ecommerce-authorizenet'), $text)
            );
        }

        return $response;
    }

    /**
     * Update the order based on the transaction status returned by Authorize.Net.
     *
     * @param string $order_id The order ID to update.
     * @param object $response The transaction details response from `fetch_transaction()`.
     * @return void
     * @throws Exception If updating the order fails.
     */
    protected function handle_transaction_response(string $order_id, object $response): void
    {
        $status = $this->transaction_builder->get_transaction_status($response->transaction);

        DB::begin_transaction();

        try {
            switch ($status) {
                case AuthorizenetConstant::PAID:
                    OrderManager::set_transaction_id($order_id, $response->transaction->transId);
                    OrderManager::mark_payment_as_paid($order_id);
                    OrderManager::mark_as_processing($order_id);
                    OrderManager::set_payment_metadata($order_id, wp_json_encode($response));
                    break;
                case AuthorizenetConstant::PENDING:
                    OrderManager::mark_payment_as_pending($order_id);
                    OrderManager::mark_as_on_hold($order_id);
                    break;
                case AuthorizenetConstant::CANCELED:
                case AuthorizenetConstant::FAILED:
                    OrderManager::set_transaction_id($order_id, $response->transaction->transId);
                    OrderManager::mark_payment_as_failed($order_id);
                    OrderManager::mark_as_cancelled($order_id);
                    OrderManager::set_payment_metadata($order_id, wp_json_encode($response));
                    break;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-authorizenet'), $e->getMessage()));
        }
    }
}
