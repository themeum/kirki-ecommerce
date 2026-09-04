<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ShippingProfile\CreateShippingProfileDTO;
use Kirki\Ecommerce\App\DTO\ShippingProfile\UpdateShippingProfileDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Supports\ExceptionThrower;

class ShippingProfileService
{
    /**
     * Return paginated shipping profiles
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all shipping profiles
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
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
        $shipping_profile = ShippingProfile::find($id);

        if (!$shipping_profile) {
            ExceptionThrower::throw(new NotFoundException(__('Shipping profile not found.', 'kirki-ecommerce'), Response::NOT_FOUND));
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
        $shipping_profile = ShippingProfile::create($data->to_array());

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
        $shipping_profile = ShippingProfile::find($data->id);

        if (empty($shipping_profile)) {
            ExceptionThrower::throw(new NotFoundException(__('Shipping profile could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND));
        }

        $is_updated = (bool) $shipping_profile->update($data->to_array());

        if (!$is_updated) {
            ExceptionThrower::throw(new NotFoundException(__('Shipping profile could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND));
        }

        return ShippingProfile::find($data->id);
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
        $is_deleted = (bool) ShippingProfile::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            ExceptionThrower::throw(new NotFoundException(__('Shipping profile could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND));
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
        $is_deleted = (bool) ShippingProfile::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            ExceptionThrower::throw(new NotFoundException(__('Shipping profiles could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND));
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
        return (bool) $this->list_query($filters)->delete();
    }

    protected function list_query(ListFilterDTO $filters)
    {
        return ShippingProfile::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where('name', 'like', '%' . $search . '%');
        })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
