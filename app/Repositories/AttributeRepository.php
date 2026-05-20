<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

class AttributeRepository
{
    /**
     * Get paginated attributes with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all attributes with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a attribute by ID.
     *
     * @param int $id
     * @return Attribute|null
     */
    public function find(int $id)
    {
        return Attribute::with('values')->find($id);
    }

    /**
     * Find a attribute by slug.
     *
     * @param string $slug
     * @return Attribute|null
     */
    public function find_by_slug(string $slug)
    {
        return Attribute::with('values')->where('slug', $slug)->first();
    }

    /**
     * Create a new attribute.
     *
     * @param array $data
     * @return Attribute
     */
    public function create(array $data)
    {
        $data = array_merge($data, [
            'slug' => Attribute::generate_unique_slug($data['slug'])
        ]);

        return Attribute::create($data);
    }

    /**
     * Update a attribute by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        $data = array_merge($data, [
            'slug' => Attribute::generate_unique_slug($data['slug'], $id)
        ]);

        return (bool) Attribute::find($id)->update($data);
    }

    /**
     * Delete a attribute by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) Attribute::find($id)->delete();
    }

    /**
     * Bulk delete attributes by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Attribute::where_in('id', $ids)->delete();
    }

    /**
     * Delete all attributes.
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
        return Attribute::with('values')
            ->when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
                return $query->where_any(['name', 'slug', 'type'], 'like', '%' . $search . '%');
            })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            })
            ->when($filters['type'] ?? null, function (QueryBuilder $query, $type) {
                return $query->where('type', $type);
            });
    }
}
