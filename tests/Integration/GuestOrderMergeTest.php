<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class GuestOrderMergeTest extends RestTestCase
{
    /**
     * A user with first and last name and no customer record gets a customer
     * with both names, and the guest orders under their email are attached.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_merge_creates_customer_with_first_and_last_name_and_attaches_guest_orders(): void
    {
        $email = $this->unique_email();
        $user_id = $this->create_wordpress_user($email, 'Ada', 'Lovelace');
        $first_order = $this->create_guest_order($email);
        $second_order = $this->create_guest_order($email);
        $other_order = $this->create_guest_order($this->unique_email());

        app()->make(OrderService::class)->merge_guest_orders($user_id);

        $customers = Customer::where('user_id', $user_id)->get();
        $this->assertCount(1, $customers);

        $customer = $customers->first();
        $this->assertSame('Ada', $customer->first_name);
        $this->assertSame('Lovelace', $customer->last_name);
        $this->assertSame($email, $customer->email);

        $this->assertSame((int) $customer->id, (int) Order::find($first_order->id)->customer_id);
        $this->assertSame((int) $customer->id, (int) Order::find($second_order->id)->customer_id);
        $this->assertEmpty(Order::find($other_order->id)->customer_id);
    }

    /**
     * A user without a last name gets a customer with an empty last name, not
     * a copy of the first name.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_merge_creates_customer_with_empty_last_name_when_user_has_none(): void
    {
        $email = $this->unique_email();
        $user_id = $this->create_wordpress_user($email, 'Ada', '');
        $order = $this->create_guest_order($email);

        app()->make(OrderService::class)->merge_guest_orders($user_id);

        $customer = Customer::where('user_id', $user_id)->first();
        $this->assertNotNull($customer);
        $this->assertSame('Ada', $customer->first_name);
        $this->assertSame('', $customer->last_name);
        $this->assertSame((int) $customer->id, (int) Order::find($order->id)->customer_id);
    }

    /**
     * A user who already has a customer record keeps it: no second customer
     * is created and the guest orders are attached to the existing one.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_merge_reuses_existing_customer_and_attaches_guest_orders(): void
    {
        $email = $this->unique_email();
        $user_id = $this->create_wordpress_user($email, 'Ada', 'Lovelace');

        $dto = new CreateCustomerDTO();
        $dto->user_id = $user_id;
        $dto->first_name = 'Existing';
        $dto->last_name = 'Person';
        $dto->email = $email;
        $existing_customer = app()->make(CustomerService::class)->create($dto);

        $order = $this->create_guest_order($email);

        app()->make(OrderService::class)->merge_guest_orders($user_id);

        $customers = Customer::where('user_id', $user_id)->get();
        $this->assertCount(1, $customers);
        $this->assertSame((int) $existing_customer->id, (int) $customers->first()->id);
        $this->assertSame('Existing', $customers->first()->first_name);
        $this->assertSame('Person', $customers->first()->last_name);
        $this->assertSame((int) $existing_customer->id, (int) Order::find($order->id)->customer_id);
    }

    /**
     * Build an email address that no other test has used.
     *
     * @return string
     * @since 1.0.0
     */
    protected function unique_email(): string
    {
        return 'guest-' . strtolower(wp_generate_password(10, false)) . '@example.com';
    }

    /**
     * Create a WordPress user with the given names.
     *
     * The display name is a single word so a missing last name cannot be
     * derived from it.
     *
     * @param string $email      User email.
     * @param string $first_name User first name.
     * @param string $last_name  User last name; empty for none.
     *
     * @return int
     * @since 1.0.0
     */
    protected function create_wordpress_user(string $email, string $first_name, string $last_name): int
    {
        return (int) static::factory()->user->create([
            'user_email' => $email,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'display_name' => strtolower($first_name),
        ]);
    }

    /**
     * Create an order placed as a guest under the given email.
     *
     * @param string $email Email the order was placed with.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function create_guest_order(string $email): Order
    {
        return Order::create([
            'customer_email' => $email,
            'currency_code' => 'USD',
            'base_currency_code' => 'USD',
        ]);
    }
}
