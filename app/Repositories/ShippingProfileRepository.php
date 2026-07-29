<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

class ShippingProfileRepository
{
    /**
     * Get paginated shipping profiles with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all shipping profiles with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a shipping profile by ID.
     *
     * @param int $id
     * @return ShippingProfile|null
     */
    public function find(int $id)
    {
        return ShippingProfile::find($id);
    }

    /**
     * Create a new shipping profile.
     *
     * @param array $data
     * @return ShippingProfile
     */
    public function create(array $data)
    {
        return ShippingProfile::create($data);
    }

    /**
     * Update a shipping profile by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        return (bool) ShippingProfile::find($id)->update($data);
    }

    /**
     * Delete a shipping profile by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) ShippingProfile::find($id)->delete();
    }

    /**
     * Bulk delete shipping profiles by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) ShippingProfile::where_in('id', $ids)->delete();
    }

    /**
     * Delete all shipping profiles.
     *
     * @param array $filters
     * @return bool
     */
    public function delete_all(array $filters = [])
    {
        return (bool) $this->list_query($filters)->delete();
    }

    protected function list_query($filters = [])
    {
        return ShippingProfile::when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
            return $query->where('name', 'like', '%' . $search . '%');
        })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
