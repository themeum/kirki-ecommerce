<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\Collection;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection as DataCollection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

class CollectionRepository
{
    /**
     * Get paginated collections with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all collections with optional search and sorting.
     *
     * @param array $filters
     * @return DataCollection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a collection by ID.
     *
     * @param int $id
     * @return Collection|null
     */
    public function find(int $id)
    {
        return Collection::with_count('products')->find($id);
    }

    /**
     * Find a collection by slug.
     *
     * @param string $slug
     * @return Collection|null
     */
    public function find_by_slug(string $slug)
    {
        return Collection::with_count('products')->where('slug', $slug)->first();
    }

    /**
     * Create a new collection.
     *
     * @param array $data
     * @return Collection
     */
    public function create(array $data)
    {
        $data = array_merge($data, [
            'slug' => Collection::generate_unique_slug($data['slug'])
        ]);

        return Collection::create($data);
    }

    /**
     * Update a collection by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        $data = array_merge($data, [
            'slug' => Collection::generate_unique_slug($data['slug'], $id)
        ]);

        return (bool) Collection::find($id)->update($data);
    }

    /**
     * Delete a collection by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) Collection::find($id)->delete();
    }

    /**
     * Bulk delete collections by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Collection::where_in('id', $ids)->delete();
    }

    /**
     * Delete all collections.
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
        return Collection::with_count('products')
            ->when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
                return $query->where_any(['title', 'slug', 'description'], 'like', '%' . $search . '%');
            })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
