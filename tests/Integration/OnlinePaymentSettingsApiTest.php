<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Tests\Support\RestTestCase;

class OnlinePaymentSettingsApiTest extends RestTestCase
{
    /**
     * Markup in a text setting is stripped before it is stored.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_save_strips_markup_from_text_settings(): void
    {
        $response = $this->request('PUT', 'online-payments/paypal', [
            'data' => ['client_id' => '<b>client-123</b>', 'sandbox' => true],
        ]);
        $this->assert_api_success($response);

        $this->assertSame('client-123', $this->stored_settings()['client_id']);
    }

    /**
     * Saving only some of a gateway's fields succeeds and does not add the others.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_partial_save_succeeds_and_adds_no_other_keys(): void
    {
        $response = $this->request('PUT', 'online-payments/paypal', [
            'data' => ['client_id' => 'client-123'],
        ]);
        $this->assert_api_success($response);

        $this->assertSame(['client_id' => 'client-123'], $this->stored_settings());
    }

    /**
     * Typical gateway credentials come back exactly as they were sent.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_typical_credentials_round_trip_unchanged(): void
    {
        $settings = [
            'client_id' => 'AeA1QIZXiflr1_-r0U2UbWTziOWX1GRQer5jkUq4ZfWT5qwb6qQRPq7jDtv',
            'client_secret' => 'EGnHDxD_qRPdaLdZz8iCr8N7_MzF-YHPTkjs6NKYQvQSBngp4PTTVWkPZRbL',
            'webhook_id' => 'WH-1A2B3C4D5E6F7G8H9',
            'sandbox' => true,
        ];

        $this->assert_api_success($this->request('PUT', 'online-payments/paypal', ['data' => $settings]));

        $this->assertSame($settings, $this->stored_settings());
    }

    /**
     * Values are sanitized before they are validated, so a boolean sent as text is accepted.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sanitization_runs_before_validation(): void
    {
        $response = $this->request('PUT', 'online-payments/paypal', [
            'data' => ['client_id' => 'client-123', 'sandbox' => 'true'],
        ]);
        $this->assert_api_success($response);

        $this->assertTrue($this->stored_settings()['sandbox']);
    }

    /**
     * Read the saved PayPal settings back through the API.
     *
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function stored_settings(): array
    {
        $payload = $this->assert_api_success($this->request('GET', 'online-payments/paypal'));

        return json_decode(wp_json_encode($payload['data']['settings']), true);
    }
}
