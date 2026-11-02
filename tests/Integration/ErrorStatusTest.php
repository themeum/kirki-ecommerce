<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Framework\Exceptions\HttpException;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * Failures a user can fix answer with a 4xx status and the failure message, not a server error.
 */
class ErrorStatusTest extends RestTestCase
{
    /**
     * Creating a second customer for the same WordPress user is a 409 conflict.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_creating_a_second_customer_for_a_user_is_a_conflict(): void
    {
        $user_id = self::factory()->user->create();
        $payload = [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'conflict-' . wp_generate_password(6, false) . '@example.com',
            'user_id' => $user_id,
        ];
        $service = app()->make(CustomerService::class);
        $service->create(CreateCustomerDTO::from_array($payload));

        try {
            $service->create(CreateCustomerDTO::from_array($payload));
            $this->fail('A second customer for the same user must be rejected.');
        } catch (HttpException $exception) {
            $this->assertSame(409, $exception->get_status());
            $this->assertSame('Customer already exists', $exception->getMessage());
        }
    }

    /**
     * Installing a payment method that is already installed is a 409 conflict.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_installing_an_installed_payment_method_is_a_conflict(): void
    {
        $response = $this->request('POST', 'online-payments/install', ['id' => 'paypal']);

        $this->assertSame('Payment method already installed.', $this->assert_api_error($response, 409)['message']);
    }

    /**
     * Asking for a second verification email inside the cool-down is answered with 422 and the wait time.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_resending_verification_email_inside_cooldown_returns_validation_status(): void
    {
        $user_id = get_current_user_id();
        update_user_meta($user_id, User::META_EMAIL_VERIFICATION_SENT_AT, time());

        $response = $this->request('POST', 'account/resend-verification-email');

        $data = $this->assert_api_error($response, 422);
        $this->assertStringContainsString('Please wait', $data['message']);
    }
}
