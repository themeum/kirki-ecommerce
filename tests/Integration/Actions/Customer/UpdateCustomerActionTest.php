<?php

namespace Kirki\Ecommerce\Tests\Integration\Actions\Customer;

use Kirki\Ecommerce\App\Actions\Customer\CreateCustomerAction;
use Kirki\Ecommerce\App\Actions\Customer\UpdateCustomerAction;
use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\DTO\Customer\UpdateCustomerDTO;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class UpdateCustomerActionTest extends RestTestCase
{
    /**
     * A submitted address carrying an existing address's ID updates that
     * address in place rather than creating a new row.
     *
     * @return void
     */
    public function test_submitted_address_with_id_updates_in_place(): void
    {
        $customer = $this->create_customer_with_addresses([
            $this->make_create_address_dto(['city' => 'New York']),
        ]);
        $existing_address = $customer->addresses->first();

        $updated = $this->execute(
            $this->make_customer_update_dto($customer),
            [$this->make_update_address_dto(['id' => $existing_address->id, 'city' => 'Boston'])]
        );

        $this->assertCount(1, $updated->addresses);
        $this->assertSame($existing_address->id, $updated->addresses->first()->id);
        $this->assertSame('Boston', $updated->addresses->first()->city);
    }

    /**
     * A submitted address with no ID is created as a new address alongside
     * whichever existing addresses are also submitted.
     *
     * @return void
     */
    public function test_submitted_address_without_id_creates_a_new_one(): void
    {
        $customer = $this->create_customer_with_addresses([
            $this->make_create_address_dto(['address_line1' => 'First St']),
        ]);
        $existing_address = $customer->addresses->first();

        $updated = $this->execute(
            $this->make_customer_update_dto($customer),
            [
                $this->make_update_address_dto(['id' => $existing_address->id, 'address_line1' => 'First St']),
                $this->make_update_address_dto(['address_line1' => 'Second St']),
            ]
        );

        $this->assertCount(2, $updated->addresses);
        $this->assertNotNull($updated->addresses->first(fn ($row) => $row->address_line1 === 'Second St'));
    }

    /**
     * An existing address left out of the submitted list is deleted.
     *
     * @return void
     */
    public function test_existing_address_omitted_from_submitted_list_is_deleted(): void
    {
        $customer = $this->create_customer_with_addresses([
            $this->make_create_address_dto(['address_line1' => 'Keep St']),
            $this->make_create_address_dto(['address_line1' => 'Drop St']),
        ]);
        $keep_address = $customer->addresses->first(fn ($row) => $row->address_line1 === 'Keep St');
        $drop_address = $customer->addresses->first(fn ($row) => $row->address_line1 === 'Drop St');

        $updated = $this->execute(
            $this->make_customer_update_dto($customer),
            [$this->make_update_address_dto(['id' => $keep_address->id, 'address_line1' => 'Keep St'])]
        );

        $this->assertCount(1, $updated->addresses);
        $this->assertSame('Keep St', $updated->addresses->first()->address_line1);
        $this->assertNull(Address::find($drop_address->id));
    }

    /**
     * Default shipping/billing are resolved across the full post-reconciliation
     * set - an existing address kept from before still wins a default it
     * wasn't explicitly re-marked for, when nothing else claims it.
     *
     * @return void
     */
    public function test_default_resolution_runs_across_full_post_reconciliation_set(): void
    {
        $customer = $this->create_customer_with_addresses([
            $this->make_create_address_dto(['address_line1' => 'First St']),
        ]);
        $existing_address = $customer->addresses->first();
        $this->assertTrue((bool) $existing_address->is_default_billing);

        $updated = $this->execute(
            $this->make_customer_update_dto($customer),
            [
                $this->make_update_address_dto(['id' => $existing_address->id, 'address_line1' => 'First St']),
                $this->make_update_address_dto(['address_line1' => 'Second St', 'is_default_shipping' => true]),
            ]
        );

        $first_row = $updated->addresses->first(fn ($row) => $row->address_line1 === 'First St');
        $second_row = $updated->addresses->first(fn ($row) => $row->address_line1 === 'Second St');

        $this->assertTrue($second_row->is_default_shipping);
        $this->assertFalse($second_row->is_default_billing);
        $this->assertTrue($first_row->is_default_billing);
        $this->assertFalse($first_row->is_default_shipping);
    }

    protected function execute(UpdateCustomerDTO $customer_payload, array $address_payloads): Customer
    {
        return app()->make(UpdateCustomerAction::class)->execute($customer_payload, $address_payloads);
    }

    protected function create_customer_with_addresses(array $addresses): Customer
    {
        $unique = wp_generate_password(8, false);

        $customer_payload = new CreateCustomerDTO();
        $customer_payload->first_name = 'Jane';
        $customer_payload->last_name = 'Smith';
        $customer_payload->email = 'customer-' . $unique . '@example.com';
        $customer_payload->addresses = $addresses;

        return app()->make(CreateCustomerAction::class)->execute($customer_payload);
    }

    protected function make_customer_update_dto(Customer $customer): UpdateCustomerDTO
    {
        $customer_payload = new UpdateCustomerDTO();
        $customer_payload->id = $customer->id;
        $customer_payload->first_name = $customer->first_name;
        $customer_payload->last_name = $customer->last_name;
        $customer_payload->email = $customer->email;

        return $customer_payload;
    }

    protected function make_create_address_dto(array $overrides = []): CreateAddressDTO
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

    protected function make_update_address_dto(array $overrides = []): UpdateAddressDTO
    {
        $address_payload = new UpdateAddressDTO();
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
