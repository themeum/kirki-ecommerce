<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentGateway;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;
use Kirki\Ecommerce\Framework\Validation\Validator;

defined('ABSPATH') || exit;
class Authorizenet extends PaymentGateway
{
    private const FORM_URL_SANDBOX = 'https://test.authorize.net/payment/payment';
    private const FORM_URL_PRODUCTION = 'https://accept.authorize.net/payment/payment';
    private const RESULT_CODE_ERROR = 'Error';

    private ?AuthorizenetClient $client = null;

    public function __construct()
    {
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

        $client = $this->get_client();

        if (!in_array($order->currency_code, $client->supported_currencies(), true)) {
            throw new Exception(__('Currency is not supported.', 'kirki-ecommerce'));
        }

        $request_builder = new AuthorizenetRequestBuilder();

        try {
            $response = $client->send([
                'getHostedPaymentPageRequest' => [
                    'merchantAuthentication' => $client->authentication(),
                    'refId' => $order->id,
                    'transactionRequest' => $request_builder->build_transaction_request($order),
                    'hostedPaymentSettings' => $request_builder->build_hosted_payment_settings($this->return_url($order)),
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

        $form_url = $client->is_sandbox() ? static::FORM_URL_SANDBOX : static::FORM_URL_PRODUCTION;

        //return $this->render_redirect_form($form_url, $response->token);
        return Http::as_form()->post($form_url, ['token' => $response->token]);
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
            <noscript>
                <button type="submit"><?php esc_html_e('Continue to payment', 'kirki-ecommerce'); ?></button>
            </noscript>
        </form>
        <script>
            document.getElementById('authorizenet-form').submit();
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

        if (empty($login_id) || empty($transaction_key)) {
            throw new Exception(__('AuthorizeNet credentials are missing.', 'kirki-ecommerce'));
        }

        $is_sandbox = (bool) ($this->settings['sandbox'] ?? false);
        return $this->client = new AuthorizenetClient($login_id, $transaction_key, $is_sandbox);
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
}
