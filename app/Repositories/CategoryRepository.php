<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

class CategoryRepository
{
    /**
     * Get paginated categories with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all categories with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a category by ID.
     *
     * @param int $id
     * @return Category|null
     */
    public function find(int $id)
    {
        return Category::with_count('products')->find($id);
    }

    /**
     * Find a category by slug.
     *
     * @param string $slug
     * @return Category|null
     */
    public function find_by_slug(string $slug)
    {
        return Category::with_count('products')->where('slug', $slug)->first();
    }

    /**
     * Create a new category.
     *
     * @param array $data
     * @return Category
     */
    public function create(array $data)
    {
        $data = array_merge($data, [
            'slug' => Category::generate_unique_slug($data['slug'])
        ]);

        return Category::create($data);
    }

    /**
     * Update a category by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        $data = array_merge($data, [
            'slug' => Category::generate_unique_slug($data['slug'], $id)
        ]);

        return (bool) Category::find($id)->update($data);
    }

    /**
     * Delete a category by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) Category::find($id)->delete();
    }

    /**
     * Bulk delete categories by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Category::where_in('id', $ids)->delete();
    }

    /**
     * Delete all categories.
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
        return Category::with_count('products')
            ->when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
                return $query->where_any(['name', 'slug', 'description'], 'like', '%' . $search . '%');
            })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
