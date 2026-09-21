<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Square Payments API.
 */
class RedsysClient
{
    protected string $merchant_code;
    protected string $terminal;
    protected bool $sandbox;
    protected string $signature_key;

    /**
     * @param string $merchant_code Square location ID.
     * @param string $terminal Square API access token.
     * @param string $signature_key Signature key used to verify webhook notifications.
     * @param bool $sandbox Whether to use the sandbox API endpoint.
     */
    public function __construct(string $merchant_code, string $terminal, string $signature_key, bool $sandbox = false)
    {
        $this->merchant_code = $merchant_code;
        $this->terminal = $terminal;
        $this->signature_key = $signature_key;
        $this->sandbox = $sandbox;
    }

    public function is_verified($merchant_params_string_B64, $ds_Order, $signature): bool
    {
        $builder = new RedsysTransactionBuilder();

        $computed_signature = $builder->create_merchant_signature($this->signature_key, $merchant_params_string_B64, $ds_Order);
        return strcasecmp($computed_signature, $signature) === 0;
    }

    /**
     * Send a request to the Square API and decode the JSON response.
     *
     * @param string $endpoint The full request URL.
     * @param string $method Either SquareConstant::POST_METHOD or SquareConstant::GET_METHOD.
     * @param array $payload The request payload, for POST requests.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    protected function send(string $endpoint, string $method, array $payload = []): array
    {
        $request = Http::with_token($this->access_token)
            ->with_headers(['Square-Version' => SquareConstant::SQUARE_VERSION]);

        $response = SquareConstant::POST_METHOD === $method
            ? $request->with_body(wp_json_encode($payload))->post($endpoint)
            : $request->get($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    protected function form_url(): string
    {
        return $this->sandbox ? RedsysConstant::FORM_SANDBOX_URL : RedsysConstant::FORM_PRODUCTION_URL;
    }

    public function render_checkout_form($encoded_merchant_params, $order_uuid)
    {
        $form_url = $this->form_url();
        $signature = (new RedsysTransactionBuilder())->create_merchant_signature($this->signature_key, $encoded_merchant_params, $order_uuid);
        $signature_version = RedsysConstant::SIGNATURE_VERSION;

        return <<<HTML
        <form name="redsys-checkout-form" action="{$form_url}" method="POST">
            <input type="hidden" name="Ds_SignatureVersion" value="{$signature_version}" />
            <input type="hidden" name="Ds_MerchantParameters" value="{$encoded_merchant_params}" />
            <input type="hidden" name="Ds_Signature" value="{$signature}" />
        </form>
        HTML;
    }
}
