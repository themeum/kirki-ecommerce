<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Repositories\AttributeValueRepository;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\AttributeValue\CreateAttributeValueDTO;
use Kirki\Ecommerce\App\DTO\AttributeValue\UpdateAttributeValueDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

class AttributeValueService
{
    protected $repository;

    public function __construct(AttributeValueRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Return all attribute values
     *
     * @param int $attribute_id
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(int $attribute_id, ListFilterDTO $filters)
    {
        return $this->repository->all($attribute_id, $filters->to_array());
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
        return $this->repository->get_ids_by_attribute_id($id);
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
        $attribute_value = $this->repository->find($id);

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
        return $this->repository->insert($values);
    }

    /**
     * Create a new attribute value.
     *
     * @param CreateAttributeValueDTO $data
     * @return AttributeValue
     */
    public function create(CreateAttributeValueDTO $data)
    {
        return $this->repository->create($data->to_array());
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
        $attribute_value = $this->repository->find($data->id);

        if (empty($attribute_value)) {
            throw new NotFoundException(__('Attribute value could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_updated = $this->repository->update($data->id, $data->to_array());

        if (!$is_updated) {
            throw new NotFoundException(__('Attribute value could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $this->repository->find($data->id);
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
        $attribute_value = $this->repository->find($id);

        if (empty($attribute_value)) {
            throw new NotFoundException(__('Attribute value could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

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
        $is_deleted = $this->repository->bulk_delete($ids);

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
        return $this->repository->delete_all($filters->to_array());
    }
}
