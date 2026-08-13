<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\TaxProfile\CreateTaxProfileDTO;
use Kirki\Ecommerce\App\DTO\TaxProfile\UpdateTaxProfileDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

class TaxProfileService
{
    /**
     * Return paginated tax profiles
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        $filters = $filters->to_array();

        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Return all tax profiles
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters->to_array())->get();
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
        $tax_profile = TaxProfile::find($id);

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
        $tax_profile = TaxProfile::create($data->to_array());

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
        $tax_profile = TaxProfile::find($data->id);

        if (empty($tax_profile)) {
            throw new NotFoundException(__('Tax profile could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_updated = (bool) TaxProfile::find($data->id)->update($data->to_array());

        if (!$is_updated) {
            throw new NotFoundException(__('Tax profile could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return TaxProfile::find($data->id);
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
        $tax_profile = TaxProfile::find($id);

        if (empty($tax_profile)) {
            throw new NotFoundException(__('Tax profile could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = (bool) TaxProfile::find($id)->delete();

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
        $is_deleted = (bool) TaxProfile::where_in('id', $ids)->delete();

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
        return (bool) $this->list_query($filters->to_array())->delete();
    }

    protected function list_query($filters = [])
    {
        return TaxProfile::when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
            return $query->where('name', 'like', '%' . $search . '%');
        })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
