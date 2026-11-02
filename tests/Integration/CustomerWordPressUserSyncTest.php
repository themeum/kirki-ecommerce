<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Actions\Customer\CreateCustomerAction;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * End-to-end coverage for the `profile_update`/`user_register` hooks that
 * keep a customer's email and WordPress-user link in sync, dispatched
 * through the real WordPress hook system this plugin registers into.
 */
class CustomerWordPressUserSyncTest extends RestTestCase
{
    /**
     * Changing a linked WordPress user's email updates the linked customer's
     * email to match.
     *
     * @return void
     */
    public function test_customer_email_follows_linked_wordpress_user_email_change(): void
    {
        $user_id = static::factory()->user->create();
        $customer = $this->create_customer_linked_to($user_id);

        $new_email = 'changed-' . wp_generate_password(8, false) . '@example.com';
        wp_update_user(['ID' => $user_id, 'user_email' => $new_email]);

        $refreshed = $this->customer_service()->find($customer->id);
        $this->assertSame($new_email, $refreshed->email);
    }

    /**
     * Updating a linked WordPress user's profile without changing their
     * email leaves the linked customer's email untouched.
     *
     * @return void
     */
    public function test_profile_update_without_email_change_leaves_customer_email_unchanged(): void
    {
        $user_id = static::factory()->user->create();
        $customer = $this->create_customer_linked_to($user_id);

        wp_update_user(['ID' => $user_id, 'first_name' => 'Changed']);

        $refreshed = $this->customer_service()->find($customer->id);
        $this->assertSame($customer->email, $refreshed->email);
    }

    /**
     * A newly created WordPress user attaches to an existing customer with
     * no linked WordPress user sharing its email.
     *
     * @return void
     */
    public function test_new_wordpress_user_attaches_to_matching_unlinked_customer(): void
    {
        $email = 'unlinked-' . wp_generate_password(8, false) . '@example.com';
        $customer = $this->create_unlinked_customer($email);
        $this->assertEmpty($customer->user_id);

        $new_user_id = static::factory()->user->create(['user_email' => $email]);

        $refreshed = $this->customer_service()->find($customer->id);
        $this->assertSame($new_user_id, $refreshed->user_id);
    }

    /**
     * `attach_wordpress_user()` never overwrites a customer's existing
     * WordPress-user link. Exercised directly rather than through a real
     * `wp_insert_user()` call, since WordPress itself refuses to create a
     * second user sharing an existing user's email - the scenario this
     * guard exists for can only arise from a lookup match, not a literal
     * duplicate-email WordPress user.
     *
     * @return void
     */
    public function test_attach_wordpress_user_does_not_overwrite_an_existing_link(): void
    {
        $original_user_id = static::factory()->user->create();
        $customer = $this->create_customer_linked_to($original_user_id);

        $another_user_id = static::factory()->user->create();

        $this->customer_service()->attach_wordpress_user($customer->email, $another_user_id);

        $refreshed = $this->customer_service()->find($customer->id);
        $this->assertSame($original_user_id, $refreshed->user_id);
    }

    protected function customer_service(): CustomerService
    {
        return app()->make(CustomerService::class);
    }

    protected function create_customer_linked_to(int $user_id)
    {
        $user = get_userdata($user_id);

        $customer_payload = new CreateCustomerDTO();
        $customer_payload->user_id = $user_id;
        $customer_payload->first_name = $user->first_name ?: 'Jane';
        $customer_payload->last_name = $user->last_name ?: 'Smith';
        $customer_payload->email = $user->user_email;

        return app()->make(CreateCustomerAction::class)->execute($customer_payload);
    }

    protected function create_unlinked_customer(string $email)
    {
        $customer_payload = new CreateCustomerDTO();
        $customer_payload->first_name = 'Jane';
        $customer_payload->last_name = 'Smith';
        $customer_payload->email = $email;
        $customer_payload->create_wordpress_user = false;

        return app()->make(CreateCustomerAction::class)->execute($customer_payload);
    }
}
