<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

class AddressService
{
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
            throw new NotFoundException(__('Address not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $address;
    }

    /**
     * Create a new address.
     *
     * @param CreateAddressDTO $data
     * @return Address
     */
    public function create(CreateAddressDTO $data)
    {
        $address = Address::create($data->to_array());

        return $address;
    }

    /**
     * Updates an address.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdateAddressDTO $data
     * @throws NotFoundException
     * @return Address
     */
    public function update(UpdateAddressDTO $data)
    {
        $address = Address::find($data->id);

        if (empty($address)) {
            throw new NotFoundException(__('Address could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_updated = (bool) Address::find($data->id)->update($data->to_array());

        if (!$is_updated) {
            throw new NotFoundException(__('Address could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return Address::find($data->id);
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
        $address = Address::find($id);

        if (empty($address)) {
            throw new NotFoundException(__('Address could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = (bool) Address::find($id)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Address could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
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
        $is_deleted = (bool) Address::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Addresses could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
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
