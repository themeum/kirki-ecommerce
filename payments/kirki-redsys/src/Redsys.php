<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;
use Throwable;

defined('ABSPATH') || exit;

/**
 * Redsys payment gateway, using the Redsys redirect (Realizar Pago) integration.
 */
class Redsys extends PaymentProvider
{
    protected ?RedsysSignature $signer = null;

    public function __construct()
    {
        $this->id = 'redsys';
        $this->title = __('Redsys', 'kirki-ecommerce-redsys');
        $this->description = __('Redsys payment gateway', 'kirki-ecommerce-redsys');
        $this->icon = $this->icon_url('redsys');
        $this->settings_key = 'redsys';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'merchant_code',
                'label' => __('Merchant Code(FUC)', 'kirki-ecommerce-redsys'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'terminal',
                'label' => __('Terminal', 'kirki-ecommerce-redsys'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'signature_key',
                'label' => __('Signature Key', 'kirki-ecommerce-redsys'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-redsys'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * Pay for an order by posting the customer to the Redsys payment page.
     *
     * @param Order $order
     * @return PaymentActionDTO
     * @throws Exception If Redsys is disabled or its credentials are missing.
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('Redsys is not enabled.', 'kirki-ecommerce-redsys'));
        }

        try {
            $builder = new RedsysTransactionBuilder($order);

            $merchant_params = $builder->build_merchant_params();
            $merchant_params['DS_MERCHANT_MERCHANTCODE'] = $this->settings['merchant_code'];
            $merchant_params['DS_MERCHANT_TERMINAL'] = $this->settings['terminal'];
            $merchant_params['DS_MERCHANT_MERCHANTURL'] = $this->webhook_url();

            $encoded_parameters = $this->get_signer()->encode_parameters($merchant_params);

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::HTML,
                'value' => $this->render_checkout_form(
                    $encoded_parameters,
                    (string) $merchant_params['DS_MERCHANT_ORDER']
                ),
            ]);
        } catch (Exception $e) {
            /* translators: %s: error message. */
            throw new Exception(sprintf(__('Redsys Payment Error: %s', 'kirki-ecommerce-redsys'), $e->getMessage()));
        }
    }

    /**
     * Handle a Redsys payment notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is invalid or the order update fails.
     */
    public function webhook()
    {
        $notification = $this->verify_and_parse_notification(Request::capture());
        $order = OrderManager::find_by_uuid((string) ($notification->Ds_MerchantData ?? ''));

        if (!$order) {
            throw new Exception(__('Redsys Error: Order Not Found.', 'kirki-ecommerce-redsys'));
        }

        if ($order->payment_status === PaymentStatus::PAID) {
            return false;
        }

        $this->handle_transaction_response($notification, $order);

        return true;
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
            'merchant_code' => 'sometimes|string',
            'terminal' => 'sometimes|string',
            'signature_key' => 'sometimes|string',
            'sandbox' => 'sometimes|boolean',
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
            'merchant_code' => Sanitizer::TEXT,
            'terminal' => Sanitizer::TEXT,
            'signature_key' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Build an auto-submitting form that posts the payment to Redsys.
     *
     * @param string $encoded_parameters
     * @param string $order_number
     * @return string
     */
    protected function render_checkout_form(string $encoded_parameters, string $order_number): string
    {
        $form_url = $this->is_sandbox() ? RedsysConstant::FORM_SANDBOX_URL : RedsysConstant::FORM_PRODUCTION_URL;
        $signature = $this->get_signer()->sign($encoded_parameters, $order_number);

        ob_start();
        ?>
        <form method="POST" id="redsys-form" action="<?php echo esc_url($form_url); ?>">
            <input type="hidden" name="Ds_SignatureVersion" value="<?php echo esc_attr(RedsysConstant::SIGNATURE_VERSION); ?>" />
            <input type="hidden" name="Ds_MerchantParameters" value="<?php echo esc_attr($encoded_parameters); ?>" />
            <input type="hidden" name="Ds_Signature" value="<?php echo esc_attr($signature); ?>" />
        </form>
        <script>
            document.getElementById('redsys-form').submit();
        </script>
        <?php
        return ob_get_clean();
    }

    /**
     * Read the notification parameters and check them against their signature.
     *
     * @param Request $request
     * @return object The decoded Ds_MerchantParameters.
     * @throws Exception If the payload is missing, malformed, or its signature is invalid.
     */
    protected function verify_and_parse_notification(Request $request): object
    {
        $encoded_parameters = $request->text('Ds_MerchantParameters');
        $signature = $request->text('Ds_Signature');

        if (empty($encoded_parameters) || empty($signature)) {
            throw new Exception(__('Invalid Payload From Redsys.', 'kirki-ecommerce-redsys'));
        }

        $signer = $this->get_signer();
        $notification = $signer->decode_parameters($encoded_parameters);

        if (!$notification) {
            throw new Exception(__('Invalid Payload From Redsys.', 'kirki-ecommerce-redsys'));
        }

        if (!$signer->verify($encoded_parameters, (string) ($notification->Ds_Order ?? ''), $signature)) {
            throw new Exception(__('Webhook Notification Is Not Valid.', 'kirki-ecommerce-redsys'));
        }

        return $notification;
    }

    /**
     * Mark the order paid or failed based on the notification's response code.
     *
     * @param object $notification The decoded Ds_MerchantParameters.
     * @param Order  $order        The local order.
     * @return void
     * @throws Exception If the order update fails; all changes are rolled back.
     */
    protected function handle_transaction_response(object $notification, Order $order)
    {
        DB::begin_transaction();

        try {
            $this->record_transaction($order, $notification);

            if ($this->is_authorized($notification)) {
                OrderManager::mark_payment_as_paid($order->id);
            } else {
                OrderManager::mark_payment_as_failed($order->id);
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollback();

            /* translators: %s: error message. */
            throw new Exception(sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-redsys'), $e->getMessage()));
        }
    }

    /**
     * Record the Redsys authorisation code and raw notification against the order.
     *
     * @param Order  $order
     * @param object $notification
     * @return void
     */
    protected function record_transaction(Order $order, object $notification): void
    {
        OrderManager::set_transaction_id($order->id, (string) ($notification->Ds_AuthorisationCode ?? ''));
        OrderManager::set_payment_metadata($order->id, wp_json_encode($notification));
    }

    /**
     * Determine whether Redsys authorized the payment.
     *
     * @param object $notification
     * @return bool
     */
    protected function is_authorized(object $notification): bool
    {
        return (int) ($notification->Ds_Response ?? -1) >= 0
            && (int) $notification->Ds_Response <= RedsysConstant::RESPONSE_CODE_AUTHORIZED_MAX;
    }

    protected function is_sandbox(): bool
    {
        return (bool) ($this->settings['sandbox'] ?? true);
    }

    /**
     * Get the signer for the configured merchant signature key.
     *
     * @return RedsysSignature
     * @throws Exception If the gateway credentials are missing.
     */
    protected function get_signer(): RedsysSignature
    {
        if ($this->signer) {
            return $this->signer;
        }

        $merchant_code = $this->settings['merchant_code'] ?? '';
        $terminal = $this->settings['terminal'] ?? '';
        $signature_key = $this->settings['signature_key'] ?? '';

        if (empty($merchant_code) || empty($terminal) || empty($signature_key)) {
            throw new Exception(__('Redsys credentials are missing.', 'kirki-ecommerce-redsys'));
        }

        return $this->signer = new RedsysSignature($signature_key);
    }
}
