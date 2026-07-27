<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\App\Repositories\ShippingProfileRepository;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ShippingProfile\CreateShippingProfileDTO;
use Kirki\Ecommerce\App\DTO\ShippingProfile\UpdateShippingProfileDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

class ShippingProfileService
{
    protected $repository;

    public function __construct(ShippingProfileRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Return paginated shipping profiles
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all shipping profiles
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
    }

    /**
     * Find a shipping profile by ID.
     *
     * @param int $id
     * @return ShippingProfile
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $shipping_profile = $this->repository->find($id);

        if (!$shipping_profile) {
            throw new NotFoundException(__('Shipping profile not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $shipping_profile;
    }

    /**
     * Create a new shipping profile.
     *
     * @param CreateShippingProfileDTO $data
     * @return ShippingProfile
     */
    public function create(CreateShippingProfileDTO $data)
    {
        $shipping_profile = $this->repository->create($data->to_array());

        return $shipping_profile;
    }

    /**
     * Updates a shipping profile.
     *
     * @param UpdateShippingProfileDTO $data
     * @throws NotFoundException
     * @return ShippingProfile
     */
    public function update(UpdateShippingProfileDTO $data)
    {
        $shipping_profile = $this->repository->find($data->id);

        if (empty($shipping_profile)) {
            throw new NotFoundException(__('Shipping profile could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_updated = $this->repository->update($data->id, $data->to_array());

        if (!$is_updated) {
            throw new NotFoundException(__('Shipping profile could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $this->repository->find($data->id);
    }

    /**
     * Deletes a shipping profile by ID.
     *
     * @param int $id The ID of the shipping profile to delete.
     * @return bool True if the shipping profile was deleted successfully, false otherwise.
     * @throws NotFoundException If the shipping profile could not be found or deleted.
     */
    public function delete(int $id)
    {
        $shipping_profile = $this->repository->find($id);

        if (empty($shipping_profile)) {
            throw new NotFoundException(__('Shipping profile could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

        if (!$is_deleted) {
            throw new NotFoundException(__('Shipping profile could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes multiple shipping profiles by their IDs.
     *
     * @param array $ids The IDs of the shipping profiles to delete.
     * @return bool True if the shipping profiles were deleted successfully, false otherwise.
     * @throws NotFoundException If the shipping profiles could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new NotFoundException(__('Shipping profiles could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes all shipping profiles.
     *
     * @param ListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return $this->repository->delete_all($filters->to_array());
    }
}
