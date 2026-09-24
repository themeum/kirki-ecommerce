<?php

namespace Kirki\Ecommerce\App\Actions\Customer;

use Kirki\Ecommerce\App\Concerns\ResolvesAddressDefaults;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\UpdateCustomerDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Updates a customer together with its addresses in one transaction.
 *
 * @since 1.0.0
 */
class UpdateCustomerAction
{
    use ResolvesAddressDefaults;

    /** @var CustomerService */
    protected $customer_service;

    /** @var AddressService */
    protected $address_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CustomerService $customer_service Customer persistence service.
     * @param AddressService  $address_service  Address persistence service.
     */
    public function __construct(
        CustomerService $customer_service,
        AddressService $address_service
    ) {
        $this->customer_service = $customer_service;
        $this->address_service = $address_service;
    }

    /**
     * Update a customer and reconcile its addresses against the submitted list.
     *
     * The customer and its addresses are updated in a single transaction. Each
     * of the customer's existing addresses not referenced by the submitted
     * list (by ID) is deleted; each submitted address carrying an ID updates
     * that existing address; each submitted address without one is created.
     * Default shipping and default billing are then resolved across the full
     * submitted set the same way address creation resolves them.
     *
     * @since 1.0.0
     *
     * @param UpdateCustomerDTO  $customer_payload Customer data to save.
     * @param UpdateAddressDTO[] $address_payloads The full set of addresses the customer should end up with.
     * @return Customer The updated customer.
     * @throws Throwable When the customer or an address cannot be saved; the transaction is rolled back.
     */
    public function execute(UpdateCustomerDTO $customer_payload, array $address_payloads)
    {
        DB::begin_transaction();

        try {
            $customer = $this->customer_service->update($customer_payload);

            throw_if(empty($customer), __('Customer could not be updated.', 'kirki-ecommerce'));

            $current_address_ids = $customer->addresses->pluck('id')->all();
            $submitted_address_ids = array_filter(array_map(function ($address_payload) {
                return $address_payload->id;
            }, $address_payloads));

            $ids_to_delete = array_diff($current_address_ids, $submitted_address_ids);

            if (!empty($ids_to_delete)) {
                $this->address_service->bulk_delete($ids_to_delete);
            }

            foreach ($this->resolve_addresses($address_payloads) as $address_payload) {
                $address_payload->customer_id = $customer->id;

                if (!empty($address_payload->id)) {
                    $this->address_service->update_without_transaction($address_payload);
                } else {
                    $this->address_service->create_without_transaction(CreateAddressDTO::from_array($address_payload->all()));
                }
            }

            DB::commit();

            return $this->customer_service->find($customer->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }
}
