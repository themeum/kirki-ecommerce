<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

class AddressRepository
{
    /**
     * Get all addresses with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function all(array $filters = [])
    {
        return Address::when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
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
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            })
            ->get();
    }

    /**
     * Find a address by ID.
     *
     * @param int $id
     * @return Address|null
     */
    public function find(int $id)
    {
        return Address::find($id);
    }

    /**
     * Create a new address.
     *
     * @param array $data
     * @return Address
     */
    public function create(array $data)
    {
        return Address::create($data);
    }

    /**
     * Update a address by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        return (bool) Address::find($id)->update($data);
    }

    /**
     * Delete a address by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) Address::find($id)->delete();
    }

    /**
     * Bulk delete address by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Address::where_in('id', $ids)->delete();
    }

    /**
     * Delete all address.
     *
     * @param array $ids
     * @return bool
     */
    public function delete_all()
    {
        return (bool) Address::query()->delete();
    }
}
