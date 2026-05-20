<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\DTO\Variant\VariantListFilterDTO;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Repositories\VariantRepository;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\DTO\Variant\UpdateVariantDTO;
use Kirki\Ecommerce\Exceptions\NotFoundException;
use Kirki\Ecommerce\Http\Response;

use function Kirki\Ecommerce\user;

class VariantService
{
    protected $repository;

    public function __construct(VariantRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get all variants with product and media.
     *
     * @param VariantListFilterDTO $filters
     * @return Collection
     */
    public function all(VariantListFilterDTO $filters)
    {
        return $this->repository->all($filters->all());
    }

    /**
     * Get all variants with product and media.
     *
     * @param VariantListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(VariantListFilterDTO $filters)
    {
        return $this->repository->paginated($filters->all());
    }

    /**
     * Get all variants with product and media by ids.
     *
     * @param array $ids
     * @return Collection
     */
    public function get_by_ids(array $ids)
    {
        return $this->repository->get_by_ids($ids);
    }

    /**
     * Find a variant by ID.
     *
     * @param int $id
     * @return Variant
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $variant = $this->repository->find($id);

        if (empty($variant)) {
            throw new NotFoundException(__('Variant not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $variant;
    }

    /**
     * Create a new variant.
     *
     * @param CreateVariantDTO $data
     * @return Variant
     */
    public function create(CreateVariantDTO $data)
    {
        $data_array = $data->all();

        $data_array['created_by'] = user()->get_id();
        $data_array['updated_by'] = user()->get_id();

        $variant = $this->repository->create($data_array);

        $variant->attribute_values()->sync($data->attribute_values);

        return $variant;
    }

    /**
     * Updates a variant.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdateVariantDTO $data
     * @throws NotFoundException
     * @return Variant
     */
    public function update(UpdateVariantDTO $data)
    {
        $variant = $this->repository->find($data->id);

        if (empty($variant)) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $data->id), Response::NOT_FOUND);
        }

        $data_array = $data->all();

        $data_array['updated_by'] = user()->get_id();

        $variant = $this->repository->update($data->id, $data_array);

        $variant->attribute_values()->sync($data->attribute_values);

        if (!$variant) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be updated.', 'kirki-ecommerce'), $data->id), Response::NOT_FOUND);
        }

        return $variant;
    }

    /**
     * Partial update
     * @param mixed $id
     * @param array $data
     * @return Variant|null
     */
    public function partial_update($id, array $data)
    {
        return $this->repository->update($id, $data) ? $this->find($id) : null;
    }

    /**
     * Bulk update
     * @param array $variants
     * @return array
     */
    public function bulk_update(array $variants)
    {
        return $this->repository->bulk_update($variants);
    }

    /**
     * Deletes a variant by ID.
     *
     * @param int $id The ID of the variant to delete.
     * @return bool True if the variant was deleted successfully, false otherwise.
     * @throws NotFoundException If the variant could not be found or deleted.
     */
    public function delete(int $id)
    {
        $variant = $this->repository->find($id);

        if (empty($variant)) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be found.', 'kirki-ecommerce'), $id), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

        if (!$is_deleted) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be deleted.', 'kirki-ecommerce'), $id), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes multiple variants by their IDs.
     *
     * @param array $ids The IDs of the variants to delete.
     * @return bool True if the variants were deleted successfully, false otherwise.
     * @throws NotFoundException If the variants could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        if (empty($ids)) {
            throw new NotFoundException(__('No variants selected.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new NotFoundException(__('Variants could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes all variants.
     *
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all()
    {
        return $this->repository->delete_all();
    }
}
