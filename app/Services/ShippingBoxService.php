<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\ShippingBox;
use Kirki\Ecommerce\App\Repositories\ShippingBoxRepository;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ShippingBox\CreateShippingBoxDTO;
use Kirki\Ecommerce\App\DTO\ShippingBox\UpdateShippingBoxDTO;
use Kirki\Ecommerce\Exceptions\NotFoundException;
use Kirki\Ecommerce\Http\Response;

class ShippingBoxService
{
    protected $repository;

    public function __construct(ShippingBoxRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Return paginated shipping boxes
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all shipping boxes
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
    }

    /**
     * Find a shipping box by ID.
     *
     * @param int $id
     * @return ShippingBox
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $shipping_box = $this->repository->find($id);

        if (!$shipping_box) {
            throw new NotFoundException(__('Shipping box not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $shipping_box;
    }

    /**
     * Find default shipping box.
     *
     * @return ShippingBox
     */
    public function find_default()
    {
        return $this->repository->find_default();
    }

    /**
     * Create a new shipping box.
     *
     * @param CreateShippingBoxDTO $data
     * @return ShippingBox
     */
    public function create(CreateShippingBoxDTO $data)
    {
        $current_default = $this->repository->find_default();

        $data->is_default = empty($current_default);

        $shipping_box = $this->repository->create($data->to_array());

        if ($shipping_box->is_default && $current_default && $current_default->id !== $shipping_box->id) {
            $this->repository->update($current_default->id, ['is_default' => false]);
        }

        return $shipping_box;
    }

    /**
     * Updates a shipping box.
     *
     * @param UpdateShippingBoxDTO $data
     * @throws NotFoundException
     * @return ShippingBox
     */
    public function update(UpdateShippingBoxDTO $data)
    {
        $shipping_box = $this->repository->find($data->id);

        if (empty($shipping_box)) {
            throw new NotFoundException(__('Shipping box could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $current_default = $this->repository->find_default();

        if ($data->is_default && $current_default && $current_default->id !== $data->id) {
            $this->repository->update($current_default->id, ['is_default' => false]);
        }

        if (!$data->is_default && $current_default && $current_default->id === $data->id) {
            throw new NotFoundException(__('At least one default shipping box is required.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        $is_updated = $this->repository->update($data->id, $data->to_array());

        if (!$is_updated) {
            throw new NotFoundException(__('Shipping box could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $this->repository->find($data->id);
    }

    /**
     * Deletes a shipping box by ID.
     *
     * @param int $id The ID of the shipping box to delete.
     * @return bool True if the shipping box was deleted successfully, false otherwise.
     * @throws NotFoundException If the shipping box could not be found or deleted.
     */
    public function delete(int $id)
    {
        $shipping_box = $this->repository->find($id);

        if (empty($shipping_box)) {
            throw new NotFoundException(__('Shipping box could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

        if (!$is_deleted) {
            throw new NotFoundException(__('Shipping box could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes multiple shipping boxes by their IDs.
     *
     * @param array $ids The IDs of the shipping boxes to delete.
     * @return bool True if the shipping boxes were deleted successfully, false otherwise.
     * @throws NotFoundException If the shipping boxes could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new NotFoundException(__('Shipping boxes could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes all tax profiles.
     *
     * @param ListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return $this->repository->delete_all($filters->to_array());
    }
}
