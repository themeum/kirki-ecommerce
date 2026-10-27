<?php

namespace Kirki\Ecommerce\Tests\Integration\Actions\Customer;

use Kirki\Ecommerce\App\Actions\Customer\CreateCustomerAction;
use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class CreateCustomerActionTest extends RestTestCase
{
    /**
     * A customer created with an empty addresses list persists no Address
     * rows and does not throw.
     *
     * @return void
     */
    public function test_customer_created_with_no_addresses_persists_no_address_rows(): void
    {
        $customer = $this->execute($this->make_customer_dto([]));

        $this->assertNotEmpty($customer->id);
        $this->assertSame(0, Address::where('customer_id', $customer->id)->count());
    }

    /**
     * A single supplied address, with no default flags set, becomes the
     * default for both shipping and billing - persisted once.
     *
     * @return void
     */
    public function test_single_address_with_no_flags_becomes_default_for_both(): void
    {
        $customer = $this->execute($this->make_customer_dto([
            $this->make_address_dto(),
        ]));

        $rows = Address::where('customer_id', $customer->id)->get();

        $this->assertCount(1, $rows);
        $this->assertTrue($rows->first()->is_default_shipping);
        $this->assertTrue($rows->first()->is_default_billing);
    }

    /**
     * A single supplied address, marked default shipping only, still ends
     * up default for both purposes - there is nothing else to be default
     * billing, so it is forced true too.
     *
     * @return void
     */
    public function test_single_address_with_only_shipping_flag_becomes_default_for_both(): void
    {
        $customer = $this->execute($this->make_customer_dto([
            $this->make_address_dto(['is_default_shipping' => true]),
        ]));

        $rows = Address::where('customer_id', $customer->id)->get();

        $this->assertCount(1, $rows);
        $this->assertTrue($rows->first()->is_default_shipping);
        $this->assertTrue($rows->first()->is_default_billing);
    }

    /**
     * Two addresses, each explicitly claiming a different default purpose,
     * are both persisted - each with exactly the one flag it claimed.
     *
     * @return void
     */
    public function test_two_addresses_each_claiming_a_different_default(): void
    {
        $customer = $this->execute($this->make_customer_dto([
            $this->make_address_dto(['address_line1' => 'Shipping St', 'is_default_shipping' => true]),
            $this->make_address_dto(['address_line1' => 'Billing St', 'is_default_billing' => true]),
        ]));

        $rows = Address::where('customer_id', $customer->id)->get();
        $this->assertCount(2, $rows);

        $shipping_row = $rows->first(fn ($row) => $row->address_line1 === 'Shipping St');
        $billing_row = $rows->first(fn ($row) => $row->address_line1 === 'Billing St');

        $this->assertTrue($shipping_row->is_default_shipping);
        $this->assertFalse($shipping_row->is_default_billing);
        $this->assertTrue($billing_row->is_default_billing);
        $this->assertFalse($billing_row->is_default_shipping);
    }

    /**
     * When two addresses both claim is_default_shipping, the first one
     * supplied wins and the second is persisted with the flag forced false.
     *
     * @return void
     */
    public function test_conflicting_default_shipping_flags_first_address_wins(): void
    {
        $customer = $this->execute($this->make_customer_dto([
            $this->make_address_dto(['address_line1' => 'First St', 'is_default_shipping' => true]),
            $this->make_address_dto(['address_line1' => 'Second St', 'is_default_shipping' => true]),
        ]));

        $rows = Address::where('customer_id', $customer->id)->get();

        $first_row = $rows->first(fn ($row) => $row->address_line1 === 'First St');
        $second_row = $rows->first(fn ($row) => $row->address_line1 === 'Second St');

        $this->assertTrue($first_row->is_default_shipping);
        $this->assertFalse($second_row->is_default_shipping);
    }

    /**
     * An address that wins neither default purpose is persisted with both
     * default flags forced false, regardless of what it was submitted with.
     *
     * @return void
     */
    public function test_address_winning_neither_default_persists_with_both_flags_false(): void
    {
        $customer = $this->execute($this->make_customer_dto([
            $this->make_address_dto(['address_line1' => 'Shipping St', 'is_default_shipping' => true]),
            $this->make_address_dto(['address_line1' => 'Billing St', 'is_default_billing' => true]),
            $this->make_address_dto(['address_line1' => 'Neither St']),
        ]));

        $rows = Address::where('customer_id', $customer->id)->get();
        $this->assertCount(3, $rows);

        $neither_row = $rows->first(fn ($row) => $row->address_line1 === 'Neither St');

        $this->assertNotNull($neither_row);
        $this->assertFalse($neither_row->is_default_shipping);
        $this->assertFalse($neither_row->is_default_billing);
    }

    /**
     * When none of the supplied addresses are flagged for either purpose,
     * the first address in the list becomes the default for both.
     *
     * @return void
     */
    public function test_no_address_flagged_falls_back_to_first_for_both_defaults(): void
    {
        $customer = $this->execute($this->make_customer_dto([
            $this->make_address_dto(['address_line1' => 'First St']),
            $this->make_address_dto(['address_line1' => 'Second St']),
        ]));

        $rows = Address::where('customer_id', $customer->id)->get();

        $first_row = $rows->first(fn ($row) => $row->address_line1 === 'First St');
        $second_row = $rows->first(fn ($row) => $row->address_line1 === 'Second St');

        $this->assertTrue($first_row->is_default_shipping);
        $this->assertTrue($first_row->is_default_billing);
        $this->assertFalse($second_row->is_default_shipping);
        $this->assertFalse($second_row->is_default_billing);
    }

    /**
     * When the submitted email already belongs to an existing WordPress user,
     * the customer is linked to that user instead of creating a new one -
     * even when a new one was also requested.
     *
     * @return void
     */
    public function test_existing_wordpress_user_by_email_is_attached_not_duplicated(): void
    {
        $email = 'existing-' . wp_generate_password(8, false) . '@example.com';
        $existing_user_id = static::factory()->user->create(['user_email' => $email]);

        $user_count_before = count(get_users(['fields' => 'ID']));

        $customer_payload = $this->make_customer_dto([]);
        $customer_payload->email = $email;
        $customer_payload->create_wordpress_user = true;

        $customer = $this->execute($customer_payload);

        $this->assertSame($existing_user_id, $customer->user_id);
        $this->assertSame($user_count_before, count(get_users(['fields' => 'ID'])));
    }

    /**
     * When no WordPress user matches the submitted email and one is
     * requested, a new WordPress user is created and linked.
     *
     * @return void
     */
    public function test_no_matching_user_and_creation_requested_creates_new_user(): void
    {
        $customer_payload = $this->make_customer_dto([]);
        $customer_payload->create_wordpress_user = true;

        $customer = $this->execute($customer_payload);

        $this->assertNotEmpty($customer->user_id);
        $user = get_userdata($customer->user_id);
        $this->assertNotFalse($user);
        $this->assertSame($customer_payload->email, $user->user_email);
    }

    /**
     * When no WordPress user matches the submitted email and none is
     * requested, the customer is created with no linked WordPress user.
     *
     * @return void
     */
    public function test_no_matching_user_and_none_requested_leaves_customer_unlinked(): void
    {
        $customer = $this->execute($this->make_customer_dto([]));

        $this->assertEmpty($customer->user_id);
    }

    protected function execute(CreateCustomerDTO $customer_payload)
    {
        return app()->make(CreateCustomerAction::class)->execute($customer_payload);
    }

    protected function make_customer_dto(array $addresses): CreateCustomerDTO
    {
        $unique = wp_generate_password(8, false);

        $customer_payload = new CreateCustomerDTO();
        $customer_payload->first_name = 'Jane';
        $customer_payload->last_name = 'Smith';
        $customer_payload->email = 'customer-' . $unique . '@example.com';
        $customer_payload->addresses = $addresses;

        return $customer_payload;
    }

    protected function make_address_dto(array $overrides = []): CreateAddressDTO
    {
        $address_payload = new CreateAddressDTO();
        $address_payload->type = AddressType::HOME;
        $address_payload->first_name = 'Jane';
        $address_payload->last_name = 'Smith';
        $address_payload->address_line1 = '123 Main St';
        $address_payload->city = 'New York';
        $address_payload->state = 'NY';
        $address_payload->country = 'US';
        $address_payload->postal_code = '10001';
        $address_payload->email = 'address-' . wp_generate_password(8, false) . '@example.com';
        $address_payload->phone = '5550100';

        foreach ($overrides as $key => $value) {
            $address_payload->{$key} = $value;
        }

        return $address_payload;
    }
}
