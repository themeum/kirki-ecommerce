<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

class ProductSchemaRepository
{
    /**
     * Get paginated product schemas with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all product schemas with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a product schema by ID.
     *
     * @param int $id
     * @return ProductSchema|null
     */
    public function find(int $id)
    {
        return ProductSchema::find($id);
    }

    /**
     * Create a new product schema.
     *
     * @param array $data
     * @return ProductSchema
     */
    public function create(array $data)
    {
        return ProductSchema::create($data);
    }

    /**
     * Update a product schema by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        return (bool) ProductSchema::find($id)->update($data);
    }

    /**
     * Delete a product schema by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) ProductSchema::find($id)->delete();
    }

    /**
     * Bulk delete product schemas by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) ProductSchema::where_in('id', $ids)->delete();
    }

    /**
     * Delete all product schemas.
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
        return ProductSchema::when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
            return $query->where('name', 'like', '%' . $search . '%');
        })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
