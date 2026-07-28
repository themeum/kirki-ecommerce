<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

class TaxProfileRepository
{
    /**
     * Get paginated tax profiles with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all tax profiles with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a tax profile by ID.
     *
     * @param int $id
     * @return TaxProfile|null
     */
    public function find(int $id)
    {
        return TaxProfile::find($id);
    }

    /**
     * Create a new tax profile.
     *
     * @param array $data
     * @return TaxProfile
     */
    public function create(array $data)
    {
        return TaxProfile::create($data);
    }

    /**
     * Update a tax profile by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        return (bool) TaxProfile::find($id)->update($data);
    }

    /**
     * Delete a tax profile by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) TaxProfile::find($id)->delete();
    }

    /**
     * Bulk delete tax profiles by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) TaxProfile::where_in('id', $ids)->delete();
    }

    /**
     * Delete all tax profiles.
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
        return TaxProfile::when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
            return $query->where('name', 'like', '%' . $search . '%');
        })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
