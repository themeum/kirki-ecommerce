<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Repositories\AttributeRepository;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Attribute\AttributeListFilterDTO;
use Kirki\Ecommerce\App\DTO\Attribute\CreateAttributeDTO;
use Kirki\Ecommerce\App\DTO\Attribute\UpdateAttributeDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use Exception;
use function Kirki\Ecommerce\Framework\user;

class AttributeService
{
    protected $repository;

    public function __construct(AttributeRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Return paginated attributes
     *
     * @param AttributeListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(AttributeListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all attributes
     *
     * @param AttributeListFilterDTO $filters
     * @return Collection
     */
    public function all(AttributeListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
    }

    /**
     * Find a attribute by ID.
     *
     * @param int $id
     * @return Attribute
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $attribute = $this->repository->find($id);

        if (empty($attribute)) {
            throw new NotFoundException(__('Attribute not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $attribute;
    }

    /**
     * Create a new attribute.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateAttributeDTO $data
     * @return Attribute
     */
    public function create(CreateAttributeDTO $data)
    {
        $data->slug = empty($data->slug) ? $data->name : $data->slug;

        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        return $this->repository->create($attributes);
    }

    /**
     * Updates a attribute.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @throws NotFoundException
     * @throws Exception
     * @return Attribute
     */
    public function update(UpdateAttributeDTO $data)
    {
        $attribute = $this->repository->find($data->id);

        if (empty($attribute)) {
            throw new NotFoundException(__('Attribute could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $data->slug = empty($data->slug) ? $data->name : $data->slug;

        if ($attribute->slug !== $data->slug && $this->repository->find_by_slug($data->slug)) {
            throw new Exception(__('Attribute slug already exists.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        $attributes = $data->except(['values']);
        $attributes['updated_by'] = user()->get_id();

        $is_updated = $this->repository->update($data->id, $attributes);

        if (!$is_updated) {
            throw new Exception(__('Attribute could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return $this->find($data->id);
    }

    /**
     * Deletes a attribute by ID.
     *
     * @param int $id The ID of the attribute to delete.
     * @return bool True if the attribute was deleted successfully, false otherwise.
     * @throws NotFoundException If the attribute could not be found or deleted.
     * @throws Exception If the attribute could not be deleted.
     */
    public function delete(int $id)
    {
        $attribute = $this->repository->find($id);

        if (empty($attribute)) {
            throw new NotFoundException(__('Attribute could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

        if (!$is_deleted) {
            throw new Exception(__('Attribute could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return true;
    }

    /**
     * Deletes multiple attributes by their IDs.
     *
     * @param array $ids The IDs of the attributes to delete.
     * @return bool True if the attributes were deleted successfully, false otherwise.
     * @throws NotFoundException If the attributes could not be found or deleted.
     * @throws Exception If the attributes could not be deleted.
     */
    public function bulk_delete(array $ids)
    {
        if (empty($ids)) {
            throw new NotFoundException(__('No attributes selected.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new Exception(__('Attributes could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return true;
    }



    /**
     * Deletes all attributes.
     *
     * @param AttributeListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(AttributeListFilterDTO $filters)
    {
        return $this->repository->delete_all($filters->to_array());
    }
}
