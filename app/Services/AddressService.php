<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\AddressPurpose;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

class AddressService
{
    /**
     * Return every address belonging to the given customer.
     *
     * @param int $customer_id
     * @return \Kirki\Ecommerce\Framework\Collections\Collection
     */
    public function all_for_customer(int $customer_id)
    {
        return Address::where('customer_id', $customer_id)->order_by('id', 'desc')->get();
    }

    /**
     * Find an address by ID, scoped to the given customer.
     *
     * @param int $id
     * @param int $customer_id
     * @return Address
     * @throws NotFoundException
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
     * Return all addresses.
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function all(ListFilterDTO $filters)
    {
        return Address::when($filters->search, function (QueryBuilder $query, $search) {
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
        })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            })
            ->get();
    }

    /**
     * Find an address by ID.
     *
     * @param int $id
     * @return Address
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $address = Address::find($id);

        if (!$address) {
            throw new NotFoundException(__('Address not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return $address;
    }

    /**
     * Create a new address.
     *
     * When the new address is marked as a default, every other address of
     * the same customer has that default flag unset in the same transaction.
     *
     * @param CreateAddressDTO $data
     * @return Address
     * @throws Throwable
     */
    public function create(CreateAddressDTO $data)
    {
        DB::begin_transaction();

        try {
            $address = Address::create($data->to_array());

            $this->enforce_single_default($address->customer_id, $address->id, !empty($data->is_default_shipping), !empty($data->is_default_billing));

            DB::commit();

            return Address::find($address->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }

    /**
     * Updates an address's details.
     *
     * Does not touch is_default_shipping/is_default_billing - see set_default().
     *
     * @param UpdateAddressDTO $data
     * @throws NotFoundException
     * @return Address
     */
    public function update(UpdateAddressDTO $data)
    {
        $address = Address::find($data->id);

        if (empty($address)) {
            throw new NotFoundException(__('Address could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $is_updated = $address->update($data->to_array());

        if (!$is_updated) {
            throw new NotFoundException(__('Address could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return Address::find($data->id);
    }

    /**
     * Marks an address as the default address for one purpose (shipping or
     * billing), unsetting that flag on every other address of the same
     * customer in the same transaction. The other purpose's current default,
     * if any, is left unchanged - call this again with the other purpose to
     * set both.
     *
     * @param int $id
     * @param string $purpose AddressPurpose::SHIPPING or AddressPurpose::BILLING
     * @throws NotFoundException
     * @throws Throwable
     * @return Address
     */
    public function set_default(int $id, string $purpose)
    {
        $address = Address::find($id);

        if (empty($address)) {
            throw new NotFoundException(__('Address not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        DB::begin_transaction();

        try {
            $address->update(['is_default_' . $purpose => true]);

            $this->enforce_single_default(
                $address->customer_id,
                $address->id,
                $purpose === AddressPurpose::SHIPPING,
                $purpose === AddressPurpose::BILLING
            );

            DB::commit();

            return Address::find($id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }

    /**
     * Unsets is_default_shipping/is_default_billing on every address of the
     * given customer other than $except_id, for each purpose being claimed.
     *
     * @param int $customer_id
     * @param int $except_id
     * @param bool $unset_shipping
     * @param bool $unset_billing
     * @return void
     */
    protected function enforce_single_default(int $customer_id, int $except_id, bool $unset_shipping, bool $unset_billing)
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
     * Deletes an address by ID.
     *
     * @param int $id The ID of the address to delete.
     * @return bool True if the address was deleted successfully, false otherwise.
     * @throws NotFoundException If the address could not be found or deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = Address::where('id', $id)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Address could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return true;
    }

    /**
     * Deletes multiple addresses by their IDs.
     *
     * @param array $ids The IDs of the addresses to delete.
     * @return bool True if the addresses were deleted successfully, false otherwise.
     * @throws NotFoundException If the addresses could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = Address::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Addresses could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return true;
    }

    /**
     * Deletes all addresses.
     *
     * @return bool True if all addresses were deleted successfully, false otherwise.
     */
    public function delete_all()
    {
        return (bool) Address::query()->delete();
    }
}
