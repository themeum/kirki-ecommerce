<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\ShippingBox;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

class ShippingBoxRepository
{
    /**
     * Get paginated shipping boxes with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all shipping boxes with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a shipping box by ID.
     *
     * @param int $id
     * @return ShippingBox|null
     */
    public function find(int $id)
    {
        return ShippingBox::find($id);
    }

    /**
     * Find default shipping box.
     *
     * @return ShippingBox|null
     */
    public function find_default()
    {
        return ShippingBox::where('is_default', true)->first() ?? null;
    }

    /**
     * Create a new shipping box.
     *
     * @param array $data
     * @return ShippingBox
     */
    public function create(array $data)
    {
        return ShippingBox::create($data);
    }

    /**
     * Update a shipping box by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        return (bool) ShippingBox::find($id)->update($data);
    }

    /**
     * Delete a shipping box by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) ShippingBox::find($id)->delete();
    }

    /**
     * Bulk delete shipping boxes by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) ShippingBox::where_in('id', $ids)->delete();
    }

    /**
     * Delete all shipping boxes.
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
        return ShippingBox::when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
            return $query->where_any(['name', 'description'], 'like', '%' . $search . '%');
        })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
