<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Constants\AddressPurpose;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Events\AddressUpdated;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Manages customer addresses: lookup, CRUD and default shipping/billing flags.
 *
 * @since 1.0.0
 */
class AddressService
{
    use HasSortableColumns;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function sortable_columns()
    {
        return [
            'id' => 'id',
            'customer_id' => 'customer_id',
            'first_name' => 'first_name',
            'last_name' => 'last_name',
            'city' => 'city',
            'state' => 'state',
            'country' => 'country',
            'postal_code' => 'postal_code',
            'email' => 'email',
            'phone' => 'phone',
            'type' => 'type',
            'label' => 'label',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get every address belonging to the given customer, newest first.
     *
     * @since 1.0.0
     *
     * @param int $customer_id Customer ID.
     * @return \Kirki\Ecommerce\Framework\Collections\Collection Collection of Address models.
     */
    public function all_for_customer(int $customer_id)
    {
        return Address::where('customer_id', $customer_id)->order_by('id', 'desc')->get();
    }

    /**
     * Find an address by ID, scoped to the given customer.
     *
     * @since 1.0.0
     *
     * @param int $id          Address ID.
     * @param int $customer_id Customer ID that must own the address.
     * @return Address
     * @throws NotFoundException When the customer has no address with that ID.
     */
    public function find_for_customer(int $id, int $customer_id)
    {
        $address = Address::where('id', $id)->where('customer_id', $customer_id)->first();

        if (!$address) {
            throw new NotFoundException(__('Address not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return $address;
    }
    /**
     * List addresses, optionally searched and sorted by the given filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search term and sorting.
     * @return Paginator
     */
    public function all(ListFilterDTO $filters)
    {
        $query = Address::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where_any(
                [
                    'first_name',
                    'last_name',
                    'address_line1',
                    'address_line2',
                    'city',
                    'state',
                    'country',
                    'postal_code',
                    'email',
                    'phone',
                ],
                'like',
                '%' . $search . '%'
            );
        });

        return $this->apply_sorting($query, $filters)->get();
    }

    /**
     * Find an address by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Address ID.
     * @return Address
     * @throws NotFoundException When the address does not exist.
     */
    public function find(int $id)
    {
        $address = Address::find($id);

        throw_if(!$address, __('Address not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $address;
    }

    /**
     * Create a new address inside a transaction.
     *
     * When the new address is marked as a default, every other address of
     * the same customer has that default flag unset in the same transaction.
     *
     * @since 1.0.0
     *
     * @param CreateAddressDTO $data Address data.
     * @return Address
     * @throws Throwable When persisting fails; the transaction is rolled back first.
     */
    public function create(CreateAddressDTO $data)
    {
        DB::begin_transaction();

        try {
            $address = $this->create_without_transaction($data);

            DB::commit();

            return $address;
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }

    /**
     * Create a new address without opening its own transaction.
     *
     * For callers (e.g. CreateOrderAction) that are already inside one.
     *
     * @since 1.0.0
     *
     * @param CreateAddressDTO $data Address data.
     * @return Address
     */
    public function create_without_transaction(CreateAddressDTO $data)
    {
        $address = Address::create($data->to_array());

        $this->unset_current_default($address->customer_id, $address->id, !empty($data->is_default_shipping), !empty($data->is_default_billing));

        return Address::find($address->id);
    }

    /**
     * Update an address's details.
     *
     * Leaves is_default_shipping/is_default_billing untouched when the
     * request omits them; when either is explicitly submitted (true or
     * false), it is set the same way set_default() sets it.
     *
     * @since 1.0.0
     *
     * @param UpdateAddressDTO $data Address data including the ID.
     * @return Address
     * @throws NotFoundException When the address does not exist or cannot be updated.
     */
    public function update(UpdateAddressDTO $data)
    {
        return $this->update_without_transaction($data);
    }

    /**
     * Update an address without opening its own transaction.
     *
     * For callers (e.g. CreateOrderAction) that are already inside one.
     * Dispatches AddressUpdated after a successful update.
     *
     * @since 1.0.0
     *
     * @param UpdateAddressDTO $data Address data including the ID.
     * @return Address
     * @throws NotFoundException When the address does not exist or cannot be updated.
     */
    public function update_without_transaction(UpdateAddressDTO $data)
    {
        $address = Address::find($data->id);

        throw_if(empty($address), __('Address could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $attributes = $data->to_array();

        if ($data->is_default_shipping === null) {
            unset($attributes['is_default_shipping']);
        }

        if ($data->is_default_billing === null) {
            unset($attributes['is_default_billing']);
        }

        $is_updated = $address->update($attributes);

        if ($is_updated && (!empty($data->is_default_shipping) || !empty($data->is_default_billing))) {
            $this->unset_current_default($address->customer_id, $address->id, !empty($data->is_default_shipping), !empty($data->is_default_billing));
        }

        throw_if(!$is_updated, __('Address could not be updated.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        AddressUpdated::dispatch($address);

        return Address::find($data->id);
    }

    /**
     * Mark an address as the customer's default for one purpose.
     *
     * Unsets that flag on every other address of the same customer in the same
     * transaction. The other purpose's current default, if any, is left
     * unchanged - call this again with the other purpose to set both.
     *
     * @since 1.0.0
     *
     * @param int    $id      Address ID.
     * @param string $purpose AddressPurpose::SHIPPING or AddressPurpose::BILLING.
     * @return Address
     * @throws Throwable When the address does not exist or persisting fails; the transaction is rolled back first.
     */
    public function set_default(int $id, string $purpose)
    {
        DB::begin_transaction();

        try {
            $address = $this->set_default_without_transaction($id, $purpose);

            DB::commit();

            return $address;
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }

    /**
     * Mark an address as default for one purpose without opening its own transaction.
     *
     * For callers (e.g. CreateOrderAction) that are already inside one.
     *
     * @since 1.0.0
     *
     * @param int    $id      Address ID.
     * @param string $purpose AddressPurpose::SHIPPING or AddressPurpose::BILLING.
     * @return Address
     * @throws NotFoundException When the address does not exist.
     */
    public function set_default_without_transaction(int $id, string $purpose)
    {
        $address = Address::find($id);

        if (empty($address)) {
            throw new NotFoundException(__('Address not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $address->update(['is_default_' . $purpose => true]);

        $this->unset_current_default(
            $address->customer_id,
            $address->id,
            $purpose === AddressPurpose::SHIPPING,
            $purpose === AddressPurpose::BILLING
        );

        return Address::find($id);
    }

    /**
     * Unset the default flags on the customer's other addresses.
     *
     * Clears is_default_shipping/is_default_billing on every address of the
     * given customer other than $except_id, for each purpose being claimed.
     *
     * @since 1.0.0
     *
     * @param int  $customer_id    Customer ID.
     * @param int  $except_id      Address ID that keeps its flags.
     * @param bool $unset_shipping Whether to clear the default shipping flag.
     * @param bool $unset_billing  Whether to clear the default billing flag.
     * @return void
     */
    protected function unset_current_default(int $customer_id, int $except_id, bool $unset_shipping, bool $unset_billing)
    {
        if ($unset_shipping) {
            Address::where('customer_id', $customer_id)
                ->where('id', '!=', $except_id)
                ->update(['is_default_shipping' => false]);
        }

        if ($unset_billing) {
            Address::where('customer_id', $customer_id)
                ->where('id', '!=', $except_id)
                ->update(['is_default_billing' => false]);
        }
    }

    /**
     * Delete an address by ID.
     *
     * When the deleted address was the default billing or shipping address, the
     * customer's first remaining address becomes the new default for that purpose.
     *
     * @since 1.0.0
     *
     * @param int $id Address ID.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When the address does not exist or cannot be deleted.
     */
    public function delete(int $id)
    {
        $address = Address::find($id);

        throw_if(!$address, __('Address not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $is_deleted = $address->delete();

        $first_address = Address::where('customer_id', $address->customer_id)->first();

        if ($is_deleted && $address->is_default_billing && $first_address) {
            $this->set_default($first_address->id, AddressPurpose::BILLING);
        }

        if ($is_deleted && $address->is_default_shipping && $first_address) {
            $this->set_default($first_address->id, AddressPurpose::SHIPPING);
        }

        throw_if(!$is_deleted, __('Address could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete multiple addresses by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Address IDs.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When no address was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = Address::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Addresses could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete every address.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function delete_all()
    {
        return (bool) Address::query()->delete();
    }
}
