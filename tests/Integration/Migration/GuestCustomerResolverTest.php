<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\GuestCustomerResolver;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers guest customers that are made from the billing contact of orders.
 */
class GuestCustomerResolverTest extends RestTestCase
{
    /**
     * Remove the customers the test created, because they are committed by the services.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        Customer::query()->delete();
    }

    /**
     * Remove the customers the test created.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        Customer::query()->delete();

        parent::tearDown();
    }

    /**
     * Two orders with the same email, in any letter case, give one guest customer without a WordPress user.
     *
     * @return void
     */
    public function test_one_guest_customer_is_created_for_each_email()
    {
        $resolver = new GuestCustomerResolver();

        $first = $resolver->resolve('Guest@Example.com', 'Gus', 'Hart', '555-2');
        $second = $resolver->resolve('guest@example.com', 'Gus', 'Hart');

        $this->assertSame($first, $second);
        $this->assertSame(1, Customer::query()->count());
        $this->assertNull(Customer::find($first)->user_id);
        $this->assertSame('555-2', Customer::find($first)->phone);
    }

    /**
     * An existing customer with the same email is reused, whatever its letter case.
     *
     * @return void
     */
    public function test_existing_customer_is_reused()
    {
        $existing = Customer::create(['first_name' => 'Ann', 'last_name' => 'Bell', 'email' => 'Ann@Example.com', 'created_by' => get_current_user_id(), 'updated_by' => get_current_user_id()]);

        $id = (new GuestCustomerResolver())->resolve('ann@example.com', 'Other', 'Name');

        $this->assertSame((int) $existing->id, $id);
        $this->assertSame(1, Customer::query()->count());
    }

    /**
     * An order without an email has no customer.
     *
     * @return void
     */
    public function test_no_email_gives_no_customer()
    {
        $this->assertNull((new GuestCustomerResolver())->resolve('', 'No', 'Mail'));
        $this->assertSame(0, Customer::query()->count());
    }
}
