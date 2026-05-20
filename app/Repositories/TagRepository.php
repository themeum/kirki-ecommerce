<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

class TagRepository
{
    /**
     * Get paginated tags with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all tags with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a tag by ID.
     *
     * @param int $id
     * @return Tag|null
     */
    public function find(int $id)
    {
        return Tag::with_count('products')->find($id);
    }

    /**
     * Find a tag by slug.
     *
     * @param string $slug
     * @return Tag|null
     */
    public function find_by_slug(string $slug)
    {
        return Tag::with_count('products')->where('slug', $slug)->first();
    }

    /**
     * Create a new tag.
     *
     * @param array $data
     * @return Tag
     */
    public function create(array $data)
    {
        $data = array_merge($data, [
            'slug' => Tag::generate_unique_slug($data['slug'])
        ]);

        return Tag::create($data);
    }

    /**
     * Update a tag by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        $data = array_merge($data, [
            'slug' => Tag::generate_unique_slug($data['slug'], $id)
        ]);

        return (bool) Tag::find($id)->update($data);
    }

    /**
     * Delete a tag by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) Tag::find($id)->delete();
    }

    /**
     * Bulk delete tags by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Tag::where_in('id', $ids)->delete();
    }

    /**
     * Delete all tags.
     *
     * @param array $filters
     * @return bool
     */
    public function delete_all(array $filters = [])
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Get the query builder for the list of tags.
     *
     * @param array $filters
     * @return QueryBuilder
     */
    protected function list_query($filters = [])
    {
        return Tag::with_count('products')
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
