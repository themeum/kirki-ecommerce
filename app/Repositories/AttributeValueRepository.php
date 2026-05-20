<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

class AttributeValueRepository
{
    /**
     * Get all attribute values with optional search and sorting.
     *
     * @param int $attribute_id
     * @param array $filters
     * @return Collection
     */
    public function all(int $attribute_id, array $filters = [])
    {
        return AttributeValue::where('attribute_id', $attribute_id)->when(!empty($filters['search']), function (QueryBuilder $query, $search) {
            return $query->where_any(['value', 'color'], 'like', '%' . $search . '%');
        })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            })->get();
    }

    /**
     * Retrieve the IDs of all attribute values associated with a given attribute ID.
     *
     * @param int $id The ID of the attribute.
     *
     * @return array An array of IDs of attribute values associated with the given attribute ID.
     */
    public function get_ids_by_attribute_id(int $id)
    {
        return array_column(AttributeValue::select('id')->where('attribute_id', $id)->get()->to_array(), 'id');
    }

    /**
     * Find a attribute value by ID.
     *
     * @param int $id
     * @return AttributeValue|null
     */
    public function find(int $id)
    {
        return AttributeValue::find($id);
    }

    /**
     * Find values by attribute ID.
     *
     * @param int $attribute_id
     * @return Collection
     */
    public function find_by_attribute_id(int $attribute_id)
    {
        return AttributeValue::where('attribute_id', $attribute_id)->get();
    }

    /**
     * Create multiple attribute values.
     *
     * @param array $values
     * @return bool
     */
    public function insert(array $values)
    {
        return AttributeValue::insert($values);
    }

    /**
     * Create a new attribute value.
     *
     * @param array $data
     * @return AttributeValue
     */
    public function create(array $data)
    {
        return AttributeValue::create($data);
    }

    /**
     * Update a attribute value by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        return (bool) AttributeValue::find($id)->update($data);
    }

    /**
     * Delete a attribute value by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) AttributeValue::find($id)->delete();
    }

    /**
     * Bulk delete attribute values by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) AttributeValue::where_in('id', $ids)->delete();
    }

    /**
     * Delete all attribute values.
     *
     * @param array $filters
     * @return bool
     */
    public function delete_all(array $filters = [])
    {
        return (bool) AttributeValue::when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
            return $query->where_any(['value', 'color'], 'like', '%' . $search . '%');
        })->delete();
    }
}
