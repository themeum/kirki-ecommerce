<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\App\Repositories\TaxProfileRepository;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\TaxProfile\CreateTaxProfileDTO;
use Kirki\Ecommerce\App\DTO\TaxProfile\UpdateTaxProfileDTO;
use Kirki\Ecommerce\Exceptions\NotFoundException;
use Kirki\Ecommerce\Http\Response;

class TaxProfileService
{
    protected $repository;

    public function __construct(TaxProfileRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Return paginated tax profiles
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all tax profiles
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
    }

    /**
     * Find a tax profile by ID.
     *
     * @param int $id
     * @return TaxProfile
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $tax_profile = $this->repository->find($id);

        if (!$tax_profile) {
            throw new NotFoundException(__('Tax profile not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $tax_profile;
    }

    /**
     * Create a new tax profile.
     *
     * @param CreateTaxProfileDTO $data
     * @return TaxProfile
     */
    public function create(CreateTaxProfileDTO $data)
    {
        $tax_profile = $this->repository->create($data->to_array());

        return $tax_profile;
    }

    /**
     * Updates a tax profile.
     *
     * @param UpdateTaxProfileDTO $data
     * @throws NotFoundException
     * @return TaxProfile
     */
    public function update(UpdateTaxProfileDTO $data)
    {
        $tax_profile = $this->repository->find($data->id);

        if (empty($tax_profile)) {
            throw new NotFoundException(__('Tax profile could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_updated = $this->repository->update($data->id, $data->to_array());

        if (!$is_updated) {
            throw new NotFoundException(__('Tax profile could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $this->repository->find($data->id);
    }

    /**
     * Deletes a tax profile by ID.
     *
     * @param int $id The ID of the tax profile to delete.
     * @return bool True if the tax profile was deleted successfully, false otherwise.
     * @throws NotFoundException If the tax profile could not be found or deleted.
     */
    public function delete(int $id)
    {
        $tax_profile = $this->repository->find($id);

        if (empty($tax_profile)) {
            throw new NotFoundException(__('Tax profile could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

        if (!$is_deleted) {
            throw new NotFoundException(__('Tax profile could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes multiple tax profiles by their IDs.
     *
     * @param array $ids The IDs of the tax profiles to delete.
     * @return bool True if the tax profiles were deleted successfully, false otherwise.
     * @throws NotFoundException If the tax profiles could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new NotFoundException(__('Tax profiles could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
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
