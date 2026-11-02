<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class CustomerBuyerEmailTest extends RestTestCase
{
    /**
     * The customer record's email wins over the account's and the entered one.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customer_record_email_takes_precedence(): void
    {
        $user_id = (int) static::factory()->user->create(['user_email' => 'account@example.com']);
        $customer = Customer::create([
            'user_id' => $user_id,
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'Record@Example.com',
        ]);

        $this->assertSame('record@example.com', $this->service()->resolve_buyer_email($customer->id, $user_id, 'typed@example.com'));
    }

    /**
     * A signed-in buyer without a customer record is identified by their account email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_account_email_is_used_without_customer_record(): void
    {
        $user_id = (int) static::factory()->user->create(['user_email' => 'account@example.com']);

        $this->assertSame('account@example.com', $this->service()->resolve_buyer_email(null, $user_id, 'typed@example.com'));
    }

    /**
     * A guest is identified by the entered email, trimmed and lowercased.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_guest_entered_email_is_normalized(): void
    {
        $this->assertSame('guest@example.com', $this->service()->resolve_buyer_email(null, null, '  Guest@Example.com '));
        $this->assertNull($this->service()->resolve_buyer_email(null, null, null));
        $this->assertNull($this->service()->resolve_buyer_email(null, null, '   '));
    }

    /**
     * The signed-in admin's own account is never mistaken for the buyer.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_acting_user_is_never_used(): void
    {
        $this->login_as_admin();

        $this->assertNull($this->service()->resolve_buyer_email(null, null, null));
    }

    /**
     * Get the customer service.
     *
     * @return CustomerService
     * @since 1.0.0
     */
    protected function service(): CustomerService
    {
        return app()->make(CustomerService::class);
    }
}
