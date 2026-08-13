<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\AttributeValue\CreateAttributeValueDTO;
use Kirki\Ecommerce\App\DTO\AttributeValue\UpdateAttributeValueDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

class AttributeValueService
{
    /**
     * Return all attribute values
     *
     * @param int $attribute_id
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(int $attribute_id, ListFilterDTO $filters)
    {
        return AttributeValue::where('attribute_id', $attribute_id)->when(!empty($filters->search), function (QueryBuilder $query, $search) {
            return $query->where_any(['value', 'color'], 'like', '%' . $search . '%');
        })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
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
     * @return AttributeValue
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $attribute_value = AttributeValue::find($id);

        if (empty($attribute_value)) {
            throw new NotFoundException(__('Attribute value not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $attribute_value;
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
     * @param CreateAttributeValueDTO $data
     * @return AttributeValue
     */
    public function create(CreateAttributeValueDTO $data)
    {
        return AttributeValue::create($data->to_array());
    }

    /**
     * Updates a attribute value.
     *
     * @param UpdateAttributeValueDTO $data
     * @throws NotFoundException
     * @return AttributeValue
     */
    public function update(UpdateAttributeValueDTO $data)
    {
        $is_updated = (bool) AttributeValue::query()->where('id', $data->id)->update($data->to_array());

        if (!$is_updated) {
            throw new NotFoundException(__('Attribute value could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return AttributeValue::find($data->id);
    }

    /**
     * Deletes a attribute by ID.
     *
     * @param int $id The ID of the attribute to delete.
     * @return bool True if the attribute was deleted successfully, false otherwise.
     * @throws NotFoundException If the attribute could not be found or deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) AttributeValue::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Attribute value could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes multiple attributes by their IDs.
     *
     * @param array $ids The IDs of the attributes to delete.
     * @return bool True if the attributes were deleted successfully, false otherwise.
     * @throws NotFoundException If the attributes could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) AttributeValue::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Attributes could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes all attributes values.
     *
     * @param ListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) AttributeValue::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where_any(['value', 'color'], 'like', '%' . $search . '%');
        })->delete();
    }
}
